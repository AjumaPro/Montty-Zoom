import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:intl/intl.dart';
import 'meeting_scheduler_screen.dart';

const String API_URL = 'http://localhost:5000';

class ScheduledMeetingsScreen extends StatefulWidget {
  const ScheduledMeetingsScreen({super.key});

  @override
  State<ScheduledMeetingsScreen> createState() => _ScheduledMeetingsScreenState();
}

class _ScheduledMeetingsScreenState extends State<ScheduledMeetingsScreen> {
  List<dynamic> _meetings = [];
  bool _isLoading = true;
  String _viewMode = 'grid'; // 'grid', 'list', 'calendar'

  @override
  void initState() {
    super.initState();
    _loadMeetings();
  }

  Future<void> _loadMeetings() async {
    setState(() => _isLoading = true);
    try {
      final response = await http.get(Uri.parse('$API_URL/api/meetings'));
      if (response.statusCode == 200) {
        setState(() {
          _meetings = json.decode(response.body);
          _isLoading = false;
        });
      } else {
        setState(() => _isLoading = false);
        _showError('Failed to load meetings');
      }
    } catch (e) {
      setState(() => _isLoading = false);
      _showError('Error: $e');
    }
  }

  Future<void> _deleteMeeting(String meetingId) async {
    try {
      final response = await http.delete(Uri.parse('$API_URL/api/meetings/$meetingId'));
      if (response.statusCode == 200) {
        _loadMeetings();
        _showSuccess('Meeting deleted');
      } else {
        _showError('Failed to delete meeting');
      }
    } catch (e) {
      _showError('Error: $e');
    }
  }

  void _showError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message), backgroundColor: Colors.red),
    );
  }

  void _showSuccess(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message), backgroundColor: Colors.green),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Scheduled Meetings'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadMeetings,
          ),
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => const MeetingSchedulerScreen(),
                ),
              ).then((_) => _loadMeetings());
            },
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _meetings.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.event_note, size: 64, color: Colors.grey),
                      const SizedBox(height: 16),
                      const Text('No scheduled meetings'),
                      const SizedBox(height: 16),
                      ElevatedButton(
                        onPressed: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (context) => const MeetingSchedulerScreen(),
                            ),
                          ).then((_) => _loadMeetings());
                        },
                        child: const Text('Schedule Meeting'),
                      ),
                    ],
                  ),
                )
              : Column(
                  children: [
                    _buildViewToggle(),
                    Expanded(child: _buildMeetingsList()),
                  ],
                ),
    );
  }

  Widget _buildViewToggle() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.end,
        children: [
          IconButton(
            icon: Icon(Icons.grid_view, color: _viewMode == 'grid' ? Colors.blue : Colors.grey),
            onPressed: () => setState(() => _viewMode = 'grid'),
          ),
          IconButton(
            icon: Icon(Icons.list, color: _viewMode == 'list' ? Colors.blue : Colors.grey),
            onPressed: () => setState(() => _viewMode = 'list'),
          ),
        ],
      ),
    );
  }

  Widget _buildMeetingsList() {
    if (_viewMode == 'grid') {
      return GridView.builder(
        padding: const EdgeInsets.all(16),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          crossAxisSpacing: 16,
          mainAxisSpacing: 16,
          childAspectRatio: 0.8,
        ),
        itemCount: _meetings.length,
        itemBuilder: (context, index) => _buildMeetingCard(_meetings[index]),
      );
    } else {
      return ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _meetings.length,
        itemBuilder: (context, index) => _buildMeetingListItem(_meetings[index]),
      );
    }
  }

  Widget _buildMeetingCard(dynamic meeting) {
    final scheduledDate = DateTime.parse(meeting['scheduledDateTime']);
    final isPast = scheduledDate.isBefore(DateTime.now());
    
    return Card(
      elevation: 4,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: InkWell(
        onTap: () => _showMeetingDetails(meeting),
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Text(
                      meeting['title'] ?? 'Untitled Meeting',
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  PopupMenuButton(
                    itemBuilder: (context) => [
                      const PopupMenuItem(
                        value: 'edit',
                        child: Row(
                          children: [
                            Icon(Icons.edit, size: 20),
                            SizedBox(width: 8),
                            Text('Edit'),
                          ],
                        ),
                      ),
                      const PopupMenuItem(
                        value: 'delete',
                        child: Row(
                          children: [
                            Icon(Icons.delete, size: 20, color: Colors.red),
                            SizedBox(width: 8),
                            Text('Delete', style: TextStyle(color: Colors.red)),
                          ],
                        ),
                      ),
                    ],
                    onSelected: (value) {
                      if (value == 'delete') {
                        _deleteMeeting(meeting['id']);
                      } else if (value == 'edit') {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (context) => MeetingSchedulerScreen(meeting: meeting),
                          ),
                        ).then((_) => _loadMeetings());
                      }
                    },
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  Icon(Icons.calendar_today, size: 16, color: Colors.grey[600]),
                  const SizedBox(width: 4),
                  Expanded(
                    child: Text(
                      DateFormat('MMM dd, yyyy').format(scheduledDate),
                      style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 4),
              Row(
                children: [
                  Icon(Icons.access_time, size: 16, color: Colors.grey[600]),
                  const SizedBox(width: 4),
                  Expanded(
                    child: Text(
                      DateFormat('hh:mm a').format(scheduledDate),
                      style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                    ),
                  ),
                ],
              ),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: isPast ? Colors.grey : Colors.green,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  isPast ? 'Past' : 'Upcoming',
                  style: const TextStyle(color: Colors.white, fontSize: 12),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildMeetingListItem(dynamic meeting) {
    final scheduledDate = DateTime.parse(meeting['scheduledDateTime']);
    final isPast = scheduledDate.isBefore(DateTime.now());
    
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: isPast ? Colors.grey : Colors.blue,
          child: const Icon(Icons.event, color: Colors.white),
        ),
        title: Text(meeting['title'] ?? 'Untitled Meeting'),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('${DateFormat('MMM dd, yyyy • hh:mm a').format(scheduledDate)}'),
            if (meeting['duration'] != null)
              Text('Duration: ${meeting['duration']} minutes'),
          ],
        ),
        trailing: PopupMenuButton(
          itemBuilder: (context) => [
            const PopupMenuItem(value: 'edit', child: Text('Edit')),
            const PopupMenuItem(value: 'delete', child: Text('Delete', style: TextStyle(color: Colors.red))),
          ],
          onSelected: (value) {
            if (value == 'delete') {
              _deleteMeeting(meeting['id']);
            } else if (value == 'edit') {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => MeetingSchedulerScreen(meeting: meeting),
                ),
              ).then((_) => _loadMeetings());
            }
          },
        ),
      ),
    );
  }

  void _showMeetingDetails(dynamic meeting) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(meeting['title'] ?? 'Untitled Meeting'),
        content: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              if (meeting['description'] != null && meeting['description'].isNotEmpty)
                Text('Description: ${meeting['description']}'),
              const SizedBox(height: 8),
              Text('Date: ${DateFormat('MMM dd, yyyy').format(DateTime.parse(meeting['scheduledDateTime']))}'),
              Text('Time: ${DateFormat('hh:mm a').format(DateTime.parse(meeting['scheduledDateTime']))}'),
              if (meeting['duration'] != null) Text('Duration: ${meeting['duration']} minutes'),
              if (meeting['roomPassword'] != null) Text('Password: ${meeting['roomPassword']}'),
            ],
          ),
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
}
