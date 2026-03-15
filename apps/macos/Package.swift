// swift-tools-version: 6.2
// Package manifest for the OpenCraft macOS companion (menu bar app + IPC library).

import PackageDescription

let package = Package(
    name: "OpenCraft",
    platforms: [
        .macOS(.v15),
    ],
    products: [
        .library(name: "OpenCraftIPC", targets: ["OpenCraftIPC"]),
        .library(name: "OpenCraftDiscovery", targets: ["OpenCraftDiscovery"]),
        .executable(name: "OpenCraft", targets: ["OpenCraft"]),
        .executable(name: "opencraft-mac", targets: ["OpenCraftMacCLI"]),
    ],
    dependencies: [
        .package(url: "https://github.com/orchetect/MenuBarExtraAccess", exact: "1.2.2"),
        .package(url: "https://github.com/swiftlang/swift-subprocess.git", from: "0.1.0"),
        .package(url: "https://github.com/apple/swift-log.git", from: "1.8.0"),
        .package(url: "https://github.com/sparkle-project/Sparkle", from: "2.8.1"),
        .package(url: "https://github.com/steipete/Peekaboo.git", branch: "main"),
        .package(path: "../shared/OpenCraftKit"),
        .package(path: "../../Swabble"),
    ],
    targets: [
        .target(
            name: "OpenCraftIPC",
            dependencies: [],
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .target(
            name: "OpenCraftDiscovery",
            dependencies: [
                .product(name: "OpenCraftKit", package: "OpenCraftKit"),
            ],
            path: "Sources/OpenCraftDiscovery",
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .executableTarget(
            name: "OpenCraft",
            dependencies: [
                "OpenCraftIPC",
                "OpenCraftDiscovery",
                .product(name: "OpenCraftKit", package: "OpenCraftKit"),
                .product(name: "OpenCraftChatUI", package: "OpenCraftKit"),
                .product(name: "OpenCraftProtocol", package: "OpenCraftKit"),
                .product(name: "SwabbleKit", package: "swabble"),
                .product(name: "MenuBarExtraAccess", package: "MenuBarExtraAccess"),
                .product(name: "Subprocess", package: "swift-subprocess"),
                .product(name: "Logging", package: "swift-log"),
                .product(name: "Sparkle", package: "Sparkle"),
                .product(name: "PeekabooBridge", package: "Peekaboo"),
                .product(name: "PeekabooAutomationKit", package: "Peekaboo"),
            ],
            exclude: [
                "Resources/Info.plist",
            ],
            resources: [
                .copy("Resources/OpenCraft.icns"),
                .copy("Resources/DeviceModels"),
            ],
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .executableTarget(
            name: "OpenCraftMacCLI",
            dependencies: [
                "OpenCraftDiscovery",
                .product(name: "OpenCraftKit", package: "OpenCraftKit"),
                .product(name: "OpenCraftProtocol", package: "OpenCraftKit"),
            ],
            path: "Sources/OpenCraftMacCLI",
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .testTarget(
            name: "OpenCraftIPCTests",
            dependencies: [
                "OpenCraftIPC",
                "OpenCraft",
                "OpenCraftDiscovery",
                .product(name: "OpenCraftProtocol", package: "OpenCraftKit"),
                .product(name: "SwabbleKit", package: "swabble"),
            ],
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
                .enableExperimentalFeature("SwiftTesting"),
            ]),
    ])
