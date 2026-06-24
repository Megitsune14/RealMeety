import 'package:flutter/material.dart';
import 'package:realmeety/core/constants.dart';

/// Cadre téléphone pour la version web — rend l'app accessible
/// sur navigateur tout en conservant l'expérience mobile.
class PhoneFrame extends StatelessWidget {
  const PhoneFrame({super.key, required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return ColoredBox(
      color: const Color(0xFF1E1E2E),
      child: Center(
        child: Semantics(
          label: 'RealMeety — application mobile dans un cadre téléphone',
          child: LayoutBuilder(
            builder: (context, constraints) {
              final scale = _computeScale(constraints);
              return Transform.scale(
                scale: scale,
                child: _PhoneShell(child: child),
              );
            },
          ),
        ),
      ),
    );
  }

  double _computeScale(BoxConstraints constraints) {
    const padding = 48.0;
    const frameW = AppConstants.phoneFrameWidth + 24;
    const frameH = AppConstants.phoneFrameHeight + 48;

    final scaleW = (constraints.maxWidth - padding) / frameW;
    final scaleH = (constraints.maxHeight - padding) / frameH;
    return (scaleW < scaleH ? scaleW : scaleH).clamp(0.5, 1.2);
  }
}

class _PhoneShell extends StatelessWidget {
  const _PhoneShell({required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: AppConstants.phoneFrameWidth + 24,
      height: AppConstants.phoneFrameHeight + 48,
      decoration: BoxDecoration(
        color: const Color(0xFF2D2D3F),
        borderRadius: BorderRadius.circular(44),
        boxShadow: const [
          BoxShadow(
            color: Color(0x66000000),
            blurRadius: 40,
            offset: Offset(0, 20),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          children: [
            _Notch(),
            Expanded(
              child: ClipRRect(
                borderRadius: BorderRadius.circular(32),
                child: SizedBox(
                  width: AppConstants.phoneFrameWidth,
                  height: AppConstants.phoneFrameHeight,
                  child: child,
                ),
              ),
            ),
            const SizedBox(height: 8),
            Container(
              width: 120,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.white24,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: 4),
          ],
        ),
      ),
    );
  }
}

class _Notch extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 28,
      child: Center(
        child: Container(
          width: 120,
          height: 28,
          decoration: BoxDecoration(
            color: const Color(0xFF1A1A2E),
            borderRadius: BorderRadius.circular(20),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 8,
                height: 8,
                decoration: const BoxDecoration(
                  color: Color(0xFF3D3D5C),
                  shape: BoxShape.circle,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
