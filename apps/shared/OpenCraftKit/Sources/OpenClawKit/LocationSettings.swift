import Foundation

public enum OpenCraftLocationMode: String, Codable, Sendable, CaseIterable {
    case off
    case whileUsing
    case always
}
