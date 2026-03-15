import Foundation

public enum OpenCraftCameraCommand: String, Codable, Sendable {
    case list = "camera.list"
    case snap = "camera.snap"
    case clip = "camera.clip"
}

public enum OpenCraftCameraFacing: String, Codable, Sendable {
    case back
    case front
}

public enum OpenCraftCameraImageFormat: String, Codable, Sendable {
    case jpg
    case jpeg
}

public enum OpenCraftCameraVideoFormat: String, Codable, Sendable {
    case mp4
}

public struct OpenCraftCameraSnapParams: Codable, Sendable, Equatable {
    public var facing: OpenCraftCameraFacing?
    public var maxWidth: Int?
    public var quality: Double?
    public var format: OpenCraftCameraImageFormat?
    public var deviceId: String?
    public var delayMs: Int?

    public init(
        facing: OpenCraftCameraFacing? = nil,
        maxWidth: Int? = nil,
        quality: Double? = nil,
        format: OpenCraftCameraImageFormat? = nil,
        deviceId: String? = nil,
        delayMs: Int? = nil)
    {
        self.facing = facing
        self.maxWidth = maxWidth
        self.quality = quality
        self.format = format
        self.deviceId = deviceId
        self.delayMs = delayMs
    }
}

public struct OpenCraftCameraClipParams: Codable, Sendable, Equatable {
    public var facing: OpenCraftCameraFacing?
    public var durationMs: Int?
    public var includeAudio: Bool?
    public var format: OpenCraftCameraVideoFormat?
    public var deviceId: String?

    public init(
        facing: OpenCraftCameraFacing? = nil,
        durationMs: Int? = nil,
        includeAudio: Bool? = nil,
        format: OpenCraftCameraVideoFormat? = nil,
        deviceId: String? = nil)
    {
        self.facing = facing
        self.durationMs = durationMs
        self.includeAudio = includeAudio
        self.format = format
        self.deviceId = deviceId
    }
}
