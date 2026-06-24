import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:realmeety/data/api/api_client.dart';
import 'package:realmeety/domain/models/user.dart';

class LegalScreen extends ConsumerStatefulWidget {
  const LegalScreen({super.key, required this.type});

  final String type;

  @override
  ConsumerState<LegalScreen> createState() => _LegalScreenState();
}

class _LegalScreenState extends ConsumerState<LegalScreen> {
  LegalDocument? _doc;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final doc = await ref.read(apiClientProvider).getLegalDocument(widget.type);
      setState(() { _doc = doc; _isLoading = false; });
    } catch (_) {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_doc?.title ?? 'Document légal'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.pop(),
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _doc == null
              ? const Center(child: Text('Document introuvable'))
              : ListView(
                  padding: const EdgeInsets.all(24),
                  children: [
                    Text(
                      'Version ${_doc!.version}',
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                    const SizedBox(height: 20),
                    ..._doc!.sections.map((section) => Padding(
                      padding: const EdgeInsets.only(bottom: 24),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            section.heading,
                            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            section.body,
                            style: Theme.of(context).textTheme.bodyLarge?.copyWith(height: 1.7),
                          ),
                        ],
                      ),
                    )),
                  ],
                ),
    );
  }
}
