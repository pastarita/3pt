import SwiftUI

/// 3PT · macOS inspector. Reads harness state through @3pt/api (THREEPT_API_URL). Secondary by rule.
@main
struct ThreePTApp: App {
    var body: some Scene {
        WindowGroup("3PT") { InspectorView() }
            .windowStyle(.hiddenTitleBar)
    }
}

struct InspectorView: View {
    @State private var policy: String = "connecting…"
    private let api = URL(string: ProcessInfo.processInfo.environment["THREEPT_API_URL"] ?? "http://127.0.0.1:8787")!

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(spacing: 14) {
                Point("Plan", 0x8b7cf6); Point("Build", 0xe0a33a); Point("Instrument", 0x3fb886)
            }
            Text("3PT · inspector").font(.system(size: 22, weight: .bold))
            ScrollView { Text(policy).font(.system(.body, design: .monospaced)).frame(maxWidth: .infinity, alignment: .leading) }
        }
        .padding(20).frame(minWidth: 640, minHeight: 420)
        .background(Color(red: 0.059, green: 0.071, blue: 0.086))
        .task { await load() }
    }

    private func load() async {
        do {
            let (data, _) = try await URLSession.shared.data(from: api.appendingPathComponent("policies/latest"))
            policy = String(decoding: data, as: UTF8.self)
        } catch { policy = "api unreachable: \(error.localizedDescription)\nstart it with: node harness/apps/api/dist/index.js" }
    }
}

private struct Point: View {
    let label: String; let hex: UInt32
    init(_ label: String, _ hex: UInt32) { self.label = label; self.hex = hex }
    var body: some View {
        HStack(spacing: 6) {
            Circle().fill(Color(red: Double((hex >> 16) & 0xff) / 255, green: Double((hex >> 8) & 0xff) / 255, blue: Double(hex & 0xff) / 255)).frame(width: 10, height: 10)
            Text(label).font(.system(size: 11, weight: .semibold)).foregroundStyle(.secondary)
        }
    }
}
