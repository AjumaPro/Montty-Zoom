import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:intl/intl.dart';

const String API_URL = 'http://localhost:5000';

class MeetingSchedulerScreen extends StatefulWidget {
  final Map<String, dynamic>? meeting;

  const MeetingSchedulerScreen({super.key, this.meeting});

  @override
  State<MeetingSchedulerScreen> createState() => _MeetingSchedulerScreenState();
}

class _MeetingSchedulerScreenState extends State<MeetingSchedulerScreen> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _passwordController = TextEditingController();
  
  DateTime? _selectedDate;
  TimeOfDay? _selectedTime;
  int _duration = 60;
  int? _reminderTime;
  bool _isRecurring = false;
  String _recurrencePattern = 'daily';
  DateTime? _recurrenceEndDate;
  int? _recurrenceCount;
  
  bool _isLoading = false;
  List<String> _participants = [];

  @override
  void initState() {
    super.initState();
    if (widget.meeting != null) {
      _loadMeetingData();
    }
  }

  void _loadMeetingData() {
    final meeting = widget.meeting!;
    _titleController.text = meeting['title'] ?? '';
    _descriptionController.text = meeting['description'] ?? '';
    _passwordController.text = meeting['roomPassword'] ?? '';
    
    final scheduledDateTime = DateTime.parse(meeting['scheduledDateTime']);
    _selectedDate = scheduledDateTime;
    _selectedTime = TimeOfDay.fromDateTime(scheduledDateTime);
    _duration = meeting['duration'] ?? 60;
    _reminderTime = meeting['reminderTime'];
    _isRecurring = meeting['isRecurring'] ?? false;
    _recurrencePattern = meeting['recurrencePattern'] ?? 'daily';
    
    if (meeting['recurrenceEndDate'] != null && meeting['recurrenceEndDate'].isNotEmpty) {
      _recurrenceEndDate = DateTime.parse(meeting['recurrenceEndDate']);
    }
    _recurrenceCount = meeting['recurrenceCount'];
    
    if (meeting['participants'] != null) {
      _participants = List<String>.from(meeting['participants']);
    }
  }

  Future<void> _selectDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _selectedDate ?? DateTime.now(),
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );
    if (picked != null) {
      setState(() => _selectedDate = picked);
    }
  }

  Future<void> _selectTime() async {
    final picked = await showTimePicker(
      context: context,
      initialTime: _selectedTime ?? TimeOfDay.now(),
    );
    if (picked != null) {
      setState(() => _selectedTime = picked);
    }
  }

  Future<void> _saveMeeting() async {
    if (!_formKey.currentState!.validate()) return;
    if (_selectedDate == null || _selectedTime == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select date and time')),
      );
      return;
    }

    setState(() => _isLoading = true);

    try {
      final scheduledDateTime = DateTime(
        _selectedDate!.year,
        _selectedDate!.month,
        _selectedDate!.day,
        _selectedTime!.hour,
        _selectedTime!.minute,
      );

      final body = {
        'title': _titleController.text.trim(),
        'description': _descriptionController.text.trim(),
        'scheduledDate': DateFormat('yyyy-MM-dd').format(_selectedDate!),
        'scheduledTime': _selectedTime!.format(context),
        'duration': _duration,
        'roomPassword': _passwordController.text.trim(),
        'reminderTime': _reminderTime,
        'participants': _participants,
        'isRecurring': _isRecurring,
        'recurrencePattern': _recurrencePattern,
        'recurrenceEndDate': _recurrenceEndDate != null
            ? DateFormat('yyyy-MM-dd').format(_recurrenceEndDate!)
            : '',
        'recurrenceCount': _recurrenceCount,
      };

      final response = widget.meeting != null
          ? await http.put(
              Uri.parse('$API_URL/api/meetings/${widget.meeting!['id']}'),
              headers: {'Content-Type': 'application/json'},
              body: json.encode(body),
            )
          : await http.post(
              Uri.parse('$API_URL/api/meetings/schedule'),
              headers: {'Content-Type': 'application/json'},
              body: json.encode(body),
            );

      if (response.statusCode == 200 || response.statusCode == 201) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Meeting saved successfully'), backgroundColor: Colors.green),
        );
        Navigator.pop(context, true);
      } else {
        _showError('Failed to save meeting');
      }
    } catch (e) {
      _showError('Error: $e');
    } finally {
      setState(() => _isLoading = false);
    }
  }

  void _showError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message), backgroundColor: Colors.red),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.meeting != null ? 'Edit Meeting' : 'Schedule Meeting'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              TextFormField(
                controller: _titleController,
                decoration: const InputDecoration(
                  labelText: 'Title *',
                  border: OutlineInputBorder(),
                ),
                validator: (value) => value?.isEmpty ?? true ? 'Title is required' : null,
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _descriptionController,
                decoration: const InputDecoration(
                  labelText: 'Description',
                  border: OutlineInputBorder(),
                ),
                maxLines: 3,
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: InkWell(
                      onTap: _selectDate,
                      child: InputDecorator(
                        decoration: const InputDecoration(
                          labelText: 'Date *',
                          border: OutlineInputBorder(),
                        ),
                        child: Text(
                          _selectedDate != null
                              ? DateFormat('MMM dd, yyyy').format(_selectedDate!)
                              : 'Select date',
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: InkWell(
                      onTap: _selectTime,
                      child: InputDecorator(
                        decoration: const InputDecoration(
                          labelText: 'Time *',
                          border: OutlineInputBorder(),
                        ),
                        child: Text(
                          _selectedTime != null
                              ? _selectedTime!.format(context)
                              : 'Select time',
                        ),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              DropdownButtonFormField<int>(
                value: _duration,
                decoration: const InputDecoration(
                  labelText: 'Duration (minutes)',
                  border: OutlineInputBorder(),
                ),
                items: [15, 30, 60, 90, 120].map((value) {
                  return DropdownMenuItem(value: value, child: Text('$value minutes'));
                }).toList(),
                onChanged: (value) => setState(() => _duration = value ?? 60),
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _passwordController,
                decoration: const InputDecoration(
                  labelText: 'Room Password (optional)',
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 16),
              CheckboxListTile(
                title: const Text('Recurring Meeting'),
                value: _isRecurring,
                onChanged: (value) => setState(() => _isRecurring = value ?? false),
              ),
              if (_isRecurring) ...[
                DropdownButtonFormField<String>(
                  value: _recurrencePattern,
                  decoration: const InputDecoration(
                    labelText: 'Recurrence Pattern',
                    border: OutlineInputBorder(),
                  ),
                  items: const [
                    DropdownMenuItem(value: 'daily', child: Text('Daily')),
                    DropdownMenuItem(value: 'weekly', child: Text('Weekly')),
                    DropdownMenuItem(value: 'monthly', child: Text('Monthly')),
                  ],
                  onChanged: (value) => setState(() => _recurrencePattern = value ?? 'daily'),
                ),
              ],
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: _isLoading ? null : _saveMeeting,
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  backgroundColor: const Color(0xFF667eea),
                ),
                child: _isLoading
                    ? const CircularProgressIndicator(color: Colors.white)
                    : const Text('Save Meeting', style: TextStyle(color: Colors.white)),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    _passwordController.dispose();
    super.dispose();
  }
}
