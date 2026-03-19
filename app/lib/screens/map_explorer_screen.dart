import 'package:flutter/material.dart';

class MapExplorerScreen extends StatefulWidget {
  const MapExplorerScreen({Key? key}) : super(key: key);

  @override
  State<MapExplorerScreen> createState() => _MapExplorerScreenState();
}

class _MapExplorerScreenState extends State<MapExplorerScreen> {
  double _selectedRadius = 2.0;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Map Explorer'),
        centerTitle: true,
      ),
      body: Column(
        children: [
          Expanded(
            child: Container(
              color: Colors.grey[300],
              child: const Center(
                child: Text(
                  'Google Maps will be integrated here',
                  textAlign: TextAlign.center,
                ),
              ),
            ),
          ),
          Container(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Radius',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                Slider(
                  value: _selectedRadius,
                  min: 0.5,
                  max: 10.0,
                  divisions: 19,
                  label: '${_selectedRadius.toStringAsFixed(1)} mi',
                  onChanged: (value) {
                    setState(() {
                      _selectedRadius = value;
                    });
                  },
                ),
                const SizedBox(height: 16),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () {
                      // TODO: Fetch summary for selected location
                    },
                    child: const Text('View Summary'),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
