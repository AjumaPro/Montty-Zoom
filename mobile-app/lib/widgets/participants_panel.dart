import 'package:flutter/material.dart';

class ParticipantsPanel extends StatelessWidget {
  final List<Map<String, dynamic>> participants;

  const ParticipantsPanel({
    super.key,
    required this.participants,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 400,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.blue,
              borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Participants (${participants.length})',
                  style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
                ),
                IconButton(
                  icon: const Icon(Icons.close, color: Colors.white),
                  onPressed: () => Navigator.pop(context),
                ),
              ],
            ),
          ),
          Expanded(
            child: participants.isEmpty
                ? const Center(
                    child: Text('No participants'),
                  )
                : ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: participants.length,
                    itemBuilder: (context, index) {
                      final participant = participants[index];
                      return ListTile(
                        leading: CircleAvatar(
                          backgroundColor: Colors.blue,
                          child: Text(
                            participant['userName']?[0].toUpperCase() ?? '?',
                            style: const TextStyle(color: Colors.white),
                          ),
                        ),
                        title: Text(participant['userName'] ?? 'Unknown'),
                        subtitle: Text(
                          participant['isHost'] == true ? 'Host' : 'Participant',
                          style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                        ),
                        trailing: participant['isVideoEnabled'] == true
                            ? const Icon(Icons.videocam, color: Colors.green)
                            : const Icon(Icons.videocam_off, color: Colors.red),
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }
}
