import CoreLocation
import Foundation
import OpenCraftKit
import UIKit

typealias OpenCraftCameraSnapResult = (format: String, base64: String, width: Int, height: Int)
typealias OpenCraftCameraClipResult = (format: String, base64: String, durationMs: Int, hasAudio: Bool)

protocol CameraServicing: Sendable {
    func listDevices() async -> [CameraController.CameraDeviceInfo]
    func snap(params: OpenCraftCameraSnapParams) async throws -> OpenCraftCameraSnapResult
    func clip(params: OpenCraftCameraClipParams) async throws -> OpenCraftCameraClipResult
}

protocol ScreenRecordingServicing: Sendable {
    func record(
        screenIndex: Int?,
        durationMs: Int?,
        fps: Double?,
        includeAudio: Bool?,
        outPath: String?) async throws -> String
}

@MainActor
protocol LocationServicing: Sendable {
    func authorizationStatus() -> CLAuthorizationStatus
    func accuracyAuthorization() -> CLAccuracyAuthorization
    func ensureAuthorization(mode: OpenCraftLocationMode) async -> CLAuthorizationStatus
    func currentLocation(
        params: OpenCraftLocationGetParams,
        desiredAccuracy: OpenCraftLocationAccuracy,
        maxAgeMs: Int?,
        timeoutMs: Int?) async throws -> CLLocation
    func startLocationUpdates(
        desiredAccuracy: OpenCraftLocationAccuracy,
        significantChangesOnly: Bool) -> AsyncStream<CLLocation>
    func stopLocationUpdates()
    func startMonitoringSignificantLocationChanges(onUpdate: @escaping @Sendable (CLLocation) -> Void)
    func stopMonitoringSignificantLocationChanges()
}

@MainActor
protocol DeviceStatusServicing: Sendable {
    func status() async throws -> OpenCraftDeviceStatusPayload
    func info() -> OpenCraftDeviceInfoPayload
}

protocol PhotosServicing: Sendable {
    func latest(params: OpenCraftPhotosLatestParams) async throws -> OpenCraftPhotosLatestPayload
}

protocol ContactsServicing: Sendable {
    func search(params: OpenCraftContactsSearchParams) async throws -> OpenCraftContactsSearchPayload
    func add(params: OpenCraftContactsAddParams) async throws -> OpenCraftContactsAddPayload
}

protocol CalendarServicing: Sendable {
    func events(params: OpenCraftCalendarEventsParams) async throws -> OpenCraftCalendarEventsPayload
    func add(params: OpenCraftCalendarAddParams) async throws -> OpenCraftCalendarAddPayload
}

protocol RemindersServicing: Sendable {
    func list(params: OpenCraftRemindersListParams) async throws -> OpenCraftRemindersListPayload
    func add(params: OpenCraftRemindersAddParams) async throws -> OpenCraftRemindersAddPayload
}

protocol MotionServicing: Sendable {
    func activities(params: OpenCraftMotionActivityParams) async throws -> OpenCraftMotionActivityPayload
    func pedometer(params: OpenCraftPedometerParams) async throws -> OpenCraftPedometerPayload
}

struct WatchMessagingStatus: Sendable, Equatable {
    var supported: Bool
    var paired: Bool
    var appInstalled: Bool
    var reachable: Bool
    var activationState: String
}

struct WatchQuickReplyEvent: Sendable, Equatable {
    var replyId: String
    var promptId: String
    var actionId: String
    var actionLabel: String?
    var sessionKey: String?
    var note: String?
    var sentAtMs: Int?
    var transport: String
}

struct WatchNotificationSendResult: Sendable, Equatable {
    var deliveredImmediately: Bool
    var queuedForDelivery: Bool
    var transport: String
}

protocol WatchMessagingServicing: AnyObject, Sendable {
    func status() async -> WatchMessagingStatus
    func setReplyHandler(_ handler: (@Sendable (WatchQuickReplyEvent) -> Void)?)
    func sendNotification(
        id: String,
        params: OpenCraftWatchNotifyParams) async throws -> WatchNotificationSendResult
}

extension CameraController: CameraServicing {}
extension ScreenRecordService: ScreenRecordingServicing {}
extension LocationService: LocationServicing {}
