import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Settings'),
        centerTitle: true,
      ),
      body: Consumer<AuthProvider>(
        builder: (context, authProvider, _) {
          return ListView(
            children: [
              ListTile(
                title: const Text('Dark Mode'),
                subtitle: const Text('Automatically enabled based on system settings'),
                trailing: const Icon(Icons.chevron_right),
                onTap: () {
                  // TODO: Add dark mode toggle
                },
              ),
              ListTile(
                title: const Text('Notifications'),
                subtitle: const Text('Get alerts for nearby events'),
                trailing: const Icon(Icons.chevron_right),
                onTap: () {
                  // TODO: Add notification settings
                },
              ),
              ListTile(
                title: const Text('Default Radius'),
                subtitle: const Text('2.0 miles'),
                trailing: const Icon(Icons.chevron_right),
                onTap: () {
                  // TODO: Add radius settings
                },
              ),
              const Divider(),
              ListTile(
                title: const Text('About'),
                trailing: const Icon(Icons.chevron_right),
                onTap: () {
                  showAboutDialog(
                    context: context,
                    applicationName: 'Pulse',
                    applicationVersion: '1.0.0',
                    applicationLegalese:
                        'Pulse is a real-time local event platform.',
                  );
                },
              ),
              ListTile(
                title: const Text('Sign Out'),
                trailing: const Icon(Icons.logout),
                onTap: () {
                  _showSignOutDialog(context, authProvider);
                },
              ),
            ],
          );
        },
      ),
    );
  }

  void _showSignOutDialog(BuildContext context, AuthProvider authProvider) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Sign Out'),
        content: const Text('Are you sure you want to sign out?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              authProvider.signOut();
              Navigator.pop(context);
            },
            child: const Text('Sign Out'),
          ),
        ],
      ),
    );
  }
}
