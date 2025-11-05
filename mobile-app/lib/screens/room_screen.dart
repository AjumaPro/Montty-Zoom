import 'package:flutter/material.dart';
import 'package:flutter_webrtc/flutter_webrtc.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import 'package:permission_handler/permission_handler.dart';
import 'dart:async';
import '../widgets/chat_panel.dart';
import '../widgets/participants_panel.dart';

class RoomScreen extends StatefulWidget {
  final String roomId;
  final String userName;

  const RoomScreen({
    super.key,
    required this.roomId,
    required this.userName,
  });

  @override
  State<RoomScreen> createState() => _RoomScreenState();
}

class _RoomScreenState extends State<RoomScreen> {
  IO.Socket? socket;
  RTCPeerConnection? peerConnection;
  MediaStream? localStream;
  final RTCVideoRenderer _localRenderer = RTCVideoRenderer();
  final Map<String, RTCVideoRenderer> _remoteRenderers = {};
  final Map<String, RTCPeerConnection> _peers = {};

  bool _isVideoEnabled = true;
  bool _isAudioEnabled = true;
  bool _isRecording = false;
  bool _showChat = false;
  bool _showParticipants = false;
  bool _isHost = false;
  bool _isModerator = false;
  
  List<Map<String, dynamic>> _participants = [];
  List<Map<String, dynamic>> _waitingRoom = [];

  String? _userId;

  @override
  void initState() {
    super.initState();
    _init();
  }

  Future<void> _init() async {
    await _requestPermissions();
    await _localRenderer.initialize();
    _userId = 'user-${DateTime.now().millisecondsSinceEpoch}-${_generateId()}';
    
    await _initializeMedia();
    _initializeSocket();
  }

  Future<void> _requestPermissions() async {
    await [
      Permission.camera,
      Permission.microphone,
    ].request();
  }

  String _generateId() {
    return DateTime.now().millisecondsSinceEpoch.toString().substring(7);
  }

  Future<void> _initializeMedia() async {
    final constraints = {
      'audio': true,
      'video': {
        'facingMode': 'user',
      }
    };

    try {
      localStream = await navigator.mediaDevices.getUserMedia(constraints);
      _localRenderer.srcObject = localStream;
      setState(() {});
    } catch (e) {
      print('Error accessing media: $e');
      _showError('Failed to access camera/microphone');
    }
  }

  void _initializeSocket() {
    socket = IO.io('http://localhost:5000', <String, dynamic>{
      'transports': ['websocket'],
    });

    socket!.on('connect', (_) {
      socket!.emit('join-room', {
        'roomId': widget.roomId,
        'userId': _userId,
        'userName': widget.userName,
      });
    });

    socket!.on('existing-users', (users) {
      setState(() {
        _participants = List<Map<String, dynamic>>.from(users);
      });
      for (var user in users) {
        _createPeerConnection(user['id'], true);
      }
    });

    socket!.on('offer', (data) async {
      final peer = _peers[data['from']];
      if (peer != null) {
        await peer.setRemoteDescription(
          RTCSessionDescription(data['offer']['sdp'], data['offer']['type']),
        );
        final answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);
        socket!.emit('answer', {
          'roomId': widget.roomId,
          'answer': {'sdp': answer.sdp, 'type': answer.type},
          'userId': _userId,
        });
      }
    });

    socket!.on('answer', (data) async {
      final peer = _peers[data['from']];
      if (peer != null) {
        await peer.setRemoteDescription(
          RTCSessionDescription(data['answer']['sdp'], data['answer']['type']),
        );
      }
    });

    socket!.on('ice-candidate', (data) async {
      final peer = _peers[data['from']];
      if (peer != null) {
        await peer.addCandidate(
          RTCIceCandidate(
            data['candidate']['candidate'],
            data['candidate']['sdpMid'],
            data['candidate']['sdpMLineIndex'],
          ),
        );
      }
    });

    socket!.on('user-left', (data) {
      final userId = data['userId'];
      _peers[userId]?.close();
      _peers.remove(userId);
      _remoteRenderers[userId]?.dispose();
      _remoteRenderers.remove(userId);
      setState(() {
        _participants.removeWhere((p) => p['userId'] == userId);
      });
    });

    socket!.on('room-info', (data) {
      setState(() {
        _isHost = data['isHost'] ?? false;
        _isModerator = data['isModerator'] ?? false;
        _participants = List<Map<String, dynamic>>.from(data['participants'] ?? []);
      });
    });

    socket!.on('user-joined', (user) {
      setState(() {
        _participants.add({
          'userId': user['id'],
          'userName': user['userName'],
          'isHost': user['isHost'] ?? false,
          'isVideoEnabled': true,
        });
      });
      _createPeerConnection(user['id'], false);
    });

    socket!.on('waiting-room-request', (data) {
      if (_isHost || _isModerator) {
        setState(() {
          _waitingRoom.add(data);
        });
        _showWaitingRoomDialog(data);
      }
    });
  }

  void _showWaitingRoomDialog(Map<String, dynamic> user) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Waiting Room Request'),
        content: Text('${user['userName']} wants to join the meeting'),
        actions: [
          TextButton(
            onPressed: () {
              socket!.emit('approve-waiting-room', {
                'roomId': widget.roomId,
                'userId': user['userId'],
                'approved': false,
              });
              Navigator.pop(context);
            },
            child: const Text('Reject', style: TextStyle(color: Colors.red)),
          ),
          TextButton(
            onPressed: () {
              socket!.emit('approve-waiting-room', {
                'roomId': widget.roomId,
                'userId': user['userId'],
                'approved': true,
              });
              setState(() {
                _waitingRoom.removeWhere((u) => u['userId'] == user['userId']);
              });
              Navigator.pop(context);
            },
            child: const Text('Approve'),
          ),
        ],
      ),
    );
  }

  Future<void> _createPeerConnection(String remoteUserId, bool isInitiator) async {
    final configuration = {
      'iceServers': [
        {'urls': 'stun:stun.l.google.com:19302'},
      ]
    };

    final peer = await createPeerConnection(configuration);

    if (localStream != null) {
      localStream!.getTracks().forEach((track) {
        peer.addTrack(track, localStream!);
      });
    }

    peer.onTrack = (event) {
      if (event.track.kind == 'video') {
        final renderer = RTCVideoRenderer();
        renderer.initialize();
        renderer.srcObject = event.streams[0];
        setState(() {
          _remoteRenderers[remoteUserId] = renderer;
        });
      }
    };

    peer.onIceCandidate = (RTCIceCandidate candidate) {
      socket!.emit('ice-candidate', {
        'roomId': widget.roomId,
        'candidate': {
          'candidate': candidate.candidate,
          'sdpMid': candidate.sdpMid,
          'sdpMLineIndex': candidate.sdpMLineIndex,
        },
        'userId': _userId,
      });
    };

    _peers[remoteUserId] = peer;

    if (isInitiator) {
      final offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      socket!.emit('offer', {
        'roomId': widget.roomId,
        'offer': {'sdp': offer.sdp, 'type': offer.type},
        'userId': _userId,
      });
    }
  }

  void _toggleVideo() {
    if (localStream != null) {
      final videoTrack = localStream!.getVideoTracks()[0];
      videoTrack.enabled = !videoTrack.enabled;
      setState(() {
        _isVideoEnabled = videoTrack.enabled;
      });
      socket!.emit('toggle-video', {
        'roomId': widget.roomId,
        'userId': _userId,
        'isVideoEnabled': _isVideoEnabled,
      });
    }
  }

  void _toggleAudio() {
    if (localStream != null) {
      final audioTrack = localStream!.getAudioTracks()[0];
      audioTrack.enabled = !audioTrack.enabled;
      setState(() {
        _isAudioEnabled = audioTrack.enabled;
      });
      socket!.emit('toggle-audio', {
        'roomId': widget.roomId,
        'userId': _userId,
        'isAudioEnabled': _isAudioEnabled,
      });
    }
  }

  void _leaveRoom() {
    localStream?.dispose();
    _peers.forEach((_, peer) => peer.close());
    _remoteRenderers.forEach((_, renderer) => renderer.dispose());
    _localRenderer.dispose();
    socket?.disconnect();
    socket?.close();
    Navigator.pop(context);
  }

  void _showError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message), backgroundColor: Colors.red),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              const Color(0xFF667eea),
              const Color(0xFF764ba2),
            ],
          ),
        ),
        child: SafeArea(
          child: Column(
            children: [
              _buildHeader(),
              Expanded(
                child: _buildVideoGrid(),
              ),
              _buildControls(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 15),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 10,
          ),
        ],
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            'Room: ${widget.roomId.substring(0, 8)}...',
            style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w600,
              color: Color(0xFF667eea),
            ),
          ),
          ElevatedButton(
            onPressed: _leaveRoom,
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red,
              foregroundColor: Colors.white,
            ),
            child: const Text('Leave'),
          ),
        ],
      ),
    );
  }

  Widget _buildVideoGrid() {
    return GridView.builder(
      padding: const EdgeInsets.all(10),
      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: _remoteRenderers.isEmpty ? 1 : 2,
        childAspectRatio: 0.8,
        crossAxisSpacing: 10,
        mainAxisSpacing: 10,
      ),
      itemCount: _remoteRenderers.length + 1,
      itemBuilder: (context, index) {
        if (index == 0) {
          return _buildLocalVideo();
        } else {
          final userId = _remoteRenderers.keys.elementAt(index - 1);
          return _buildRemoteVideo(userId);
        }
      },
    );
  }

  Widget _buildLocalVideo() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.black,
        borderRadius: BorderRadius.circular(15),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.3),
            blurRadius: 10,
          ),
        ],
      ),
      child: Stack(
        fit: StackFit.expand,
        children: [
          RTCVideoView(
            _localRenderer,
            mirror: true,
            objectFit: RTCVideoViewObjectFit.RTCVideoViewObjectFitCover,
          ),
          Positioned(
            bottom: 10,
            left: 10,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
              decoration: BoxDecoration(
                color: Colors.black.withOpacity(0.7),
                borderRadius: BorderRadius.circular(5),
              ),
              child: Text(
                '${widget.userName} (You)',
                style: const TextStyle(color: Colors.white),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRemoteVideo(String userId) {
    final renderer = _remoteRenderers[userId];
    if (renderer == null) return const SizedBox();

    return Container(
      decoration: BoxDecoration(
        color: Colors.black,
        borderRadius: BorderRadius.circular(15),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.3),
            blurRadius: 10,
          ),
        ],
      ),
      child: RTCVideoView(
        renderer,
        objectFit: RTCVideoViewObjectFit.RTCVideoViewObjectFitCover,
      ),
    );
  }

  Widget _buildControls() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 10,
          ),
        ],
      ),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
        children: [
          _buildControlButton(
            icon: _isVideoEnabled ? Icons.videocam : Icons.videocam_off,
            onPressed: _toggleVideo,
            color: _isVideoEnabled ? Colors.blue : Colors.red,
          ),
          _buildControlButton(
            icon: _isAudioEnabled ? Icons.mic : Icons.mic_off,
            onPressed: _toggleAudio,
            color: _isAudioEnabled ? Colors.blue : Colors.red,
            ),
            _buildControlButton(
              icon: Icons.chat,
              onPressed: () {
                setState(() => _showChat = true);
                _showChatPanel();
              },
              color: Colors.green,
            ),
            _buildControlButton(
              icon: Icons.people,
              onPressed: () {
                setState(() => _showParticipants = true);
                _showParticipantsPanel();
              },
              color: Colors.purple,
            ),
            _buildControlButton(
              icon: Icons.emoji_emotions,
              onPressed: _showReactions,
              color: Colors.orange,
            ),
            if (_isHost || _isModerator)
              _buildControlButton(
                icon: Icons.security,
                onPressed: _showWaitingRoom,
                color: Colors.amber,
          ),
          _buildControlButton(
            icon: _isRecording ? Icons.stop : Icons.fiber_manual_record,
            onPressed: () {
                setState(() => _isRecording = !_isRecording);
                socket?.emit('toggle-recording', {
                  'roomId': widget.roomId,
                  'userId': _userId,
                  'isRecording': _isRecording,
                });
              },
              color: _isRecording ? Colors.red : Colors.grey,
            ),
            _buildControlButton(
              icon: Icons.settings,
              onPressed: _showSettings,
              color: Colors.grey,
            ),
            _buildControlButton(
              icon: Icons.call_end,
              onPressed: _leaveRoom,
              color: Colors.red,
            ),
          ],
        ),
      ),
    );
  }

  void _showChatPanel() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => ChatPanel(
        socket: socket,
        roomId: widget.roomId,
        userId: _userId!,
        userName: widget.userName,
      ),
    ).then((_) => setState(() => _showChat = false));
  }

  void _showParticipantsPanel() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => ParticipantsPanel(participants: _participants),
    ).then((_) => setState(() => _showParticipants = false));
  }

  void _showReactions() {
    showModalBottomSheet(
      context: context,
      builder: (context) => Container(
        padding: const EdgeInsets.all(20),
        child: Wrap(
          spacing: 16,
          runSpacing: 16,
          alignment: WrapAlignment.center,
          children: ['👍', '👎', '❤️', '😂', '😮', '🎉'].map((emoji) {
            return InkWell(
              onTap: () {
                socket?.emit('reaction', {
                  'roomId': widget.roomId,
                  'userId': _userId,
                  'userName': widget.userName,
                  'reaction': emoji,
                });
                Navigator.pop(context);
                _showSuccess('Reaction sent');
              },
              child: Container(
                width: 60,
                height: 60,
                decoration: BoxDecoration(
                  color: Colors.grey[200],
                  borderRadius: BorderRadius.circular(30),
                ),
                child: Center(
                  child: Text(emoji, style: const TextStyle(fontSize: 30)),
                ),
              ),
            );
          }).toList(),
        ),
      ),
    );
  }

  void _showWaitingRoom() {
    if (_waitingRoom.isEmpty) {
      _showError('No one in waiting room');
      return;
    }
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Waiting Room'),
        content: SizedBox(
          width: double.maxFinite,
          child: ListView.builder(
            shrinkWrap: true,
            itemCount: _waitingRoom.length,
            itemBuilder: (context, index) {
              final user = _waitingRoom[index];
              return ListTile(
                title: Text(user['userName']),
                trailing: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    IconButton(
                      icon: const Icon(Icons.check, color: Colors.green),
                      onPressed: () {
                        socket?.emit('approve-waiting-room', {
                          'roomId': widget.roomId,
                          'userId': user['userId'],
                          'approved': true,
                        });
                        setState(() {
                          _waitingRoom.removeAt(index);
                        });
                        Navigator.pop(context);
                      },
                    ),
                    IconButton(
                      icon: const Icon(Icons.close, color: Colors.red),
                      onPressed: () {
                        socket?.emit('approve-waiting-room', {
                          'roomId': widget.roomId,
                          'userId': user['userId'],
                          'approved': false,
                        });
                        setState(() {
                          _waitingRoom.removeAt(index);
                        });
                        Navigator.pop(context);
                      },
                    ),
                  ],
                ),
              );
            },
          ),
        ),
      ),
    );
  }

  void _showSettings() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Settings'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            SwitchListTile(
              title: const Text('Video'),
              value: _isVideoEnabled,
              onChanged: (value) => _toggleVideo(),
            ),
            SwitchListTile(
              title: const Text('Audio'),
              value: _isAudioEnabled,
              onChanged: (value) => _toggleAudio(),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Close'),
          ),
        ],
      ),
    );
  }

  void _showSuccess(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message), backgroundColor: Colors.green),
    );
  }

  Widget _buildControlButton({
    required IconData icon,
    required VoidCallback onPressed,
    required Color color,
  }) {
    return CircleAvatar(
      radius: 30,
      backgroundColor: color,
      child: IconButton(
        icon: Icon(icon, color: Colors.white),
        onPressed: onPressed,
      ),
    );
  }

  @override
  void dispose() {
    localStream?.dispose();
    _peers.forEach((_, peer) => peer.close());
    _remoteRenderers.forEach((_, renderer) => renderer.dispose());
    _localRenderer.dispose();
    socket?.disconnect();
    socket?.close();
    super.dispose();
  }
}

