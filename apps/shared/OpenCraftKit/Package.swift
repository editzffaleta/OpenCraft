// swift-tools-version: 6.2

import PackageDescription

let package = Package(
    name: "OpenCraftKit",
    platforms: [
        .iOS(.v18),
        .macOS(.v15),
    ],
    products: [
        .library(name: "OpenCraftProtocol", targets: ["OpenCraftProtocol"]),
        .library(name: "OpenCraftKit", targets: ["OpenCraftKit"]),
        .library(name: "OpenCraftChatUI", targets: ["OpenCraftChatUI"]),
    ],
    dependencies: [
        .package(url: "https://github.com/steipete/ElevenLabsKit", exact: "0.1.0"),
        .package(url: "https://github.com/gonzalezreal/textual", exact: "0.3.1"),
    ],
    targets: [
        .target(
            name: "OpenCraftProtocol",
            path: "Sources/OpenCraftProtocol",
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .target(
            name: "OpenCraftKit",
            dependencies: [
                "OpenCraftProtocol",
                .product(name: "ElevenLabsKit", package: "ElevenLabsKit"),
            ],
            path: "Sources/OpenCraftKit",
            resources: [
                .process("Resources"),
            ],
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .target(
            name: "OpenCraftChatUI",
            dependencies: [
                "OpenCraftKit",
                .product(
                    name: "Textual",
                    package: "textual",
                    condition: .when(platforms: [.macOS, .iOS])),
            ],
            path: "Sources/OpenCraftChatUI",
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .testTarget(
            name: "OpenCraftKitTests",
            dependencies: ["OpenCraftKit", "OpenCraftChatUI"],
            path: "Tests/OpenCraftKitTests",
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
                .enableExperimentalFeature("SwiftTesting"),
            ]),
    ])
