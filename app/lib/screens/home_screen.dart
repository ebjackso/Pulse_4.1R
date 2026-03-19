import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../providers/location_provider.dart';
import '../providers/summary_provider.dart';
import '../widgets/report_submission_sheet.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({Key? key}) : super(key: key);

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  @override
  void initState() {
    super.initState();
    _loadInitialData();
  }

  Future<void> _loadInitialData() async {
    final authProvider = context.read<AuthProvider>();
    if (!authProvider.isSignedIn) {
      await authProvider.signUpAnonymously();
    }

    final locationProvider = context.read<LocationProvider>();
    await locationProvider.updateCurrentLocation();

    if (mounted && locationProvider.currentPosition != null) {
      final summaryProvider = context.read<SummaryProvider>();
      await summaryProvider.fetchSummary(
        latitude: locationProvider.currentPosition!.latitude,
        longitude: locationProvider.currentPosition!.longitude,
        radiusMiles: 2.0,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Pulse'),
        centerTitle: true,
        elevation: 0,
      ),
      body: RefreshIndicator(
        onRefresh: _loadInitialData,
        child: Consumer2<LocationProvider, SummaryProvider>(
          builder: (context, locationProvider, summaryProvider, _) {
            if (locationProvider.isLoading || summaryProvider.isLoading) {
              return const Center(child: CircularProgressIndicator());
            }

            if (locationProvider.error != null) {
              return Center(
                child: Text(
                  'Location Error: ${locationProvider.error}',
                  textAlign: TextAlign.center,
                ),
              );
            }

            if (summaryProvider.currentSummary == null) {
              return const Center(
                child: Text('Pull down to load summary'),
              );
            }

            final summary = summaryProvider.currentSummary!;

            return SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Location info
                    Card(
                      child: Padding(
                        padding: const EdgeInsets.all(12.0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Current Location',
                              style: TextStyle(
                                fontSize: 14,
                                color: Colors.grey,
                              ),
                            ),
                            const SizedBox(height: 8),
                            if (locationProvider.currentPosition != null)
                              Text(
                                '${locationProvider.currentPosition!.latitude.toStringAsFixed(4)}, '
                                '${locationProvider.currentPosition!.longitude.toStringAsFixed(4)} '
                                '(2 mi radius)',
                                style: const TextStyle(fontSize: 16),
                              ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),

                    // Summary
                    const Text(
                      'What\'s Happening Now',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 12),
                    Card(
                      child: Padding(
                        padding: const EdgeInsets.all(12.0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              summary.text,
                              style: const TextStyle(fontSize: 14),
                            ),
                            const SizedBox(height: 12),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  '${summary.reportCount} reports',
                                  style: const TextStyle(
                                    fontSize: 12,
                                    color: Colors.grey,
                                  ),
                                ),
                                Text(
                                  summary.cached ? '(cached)' : '(live)',
                                  style: TextStyle(
                                    fontSize: 12,
                                    color: Colors.grey,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _showReportSheet,
        child: const Icon(Icons.add),
      ),
    );
  }

  void _showReportSheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (_) => const ReportSubmissionSheet(),
    );
  }
}
