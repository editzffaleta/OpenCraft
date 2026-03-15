package ai.opencraft.app.protocol

import org.junit.Assert.assertEquals
import org.junit.Test

class OpenCraftProtocolConstantsTest {
  @Test
  fun canvasCommandsUseStableStrings() {
    assertEquals("canvas.present", OpenCraftCanvasCommand.Present.rawValue)
    assertEquals("canvas.hide", OpenCraftCanvasCommand.Hide.rawValue)
    assertEquals("canvas.navigate", OpenCraftCanvasCommand.Navigate.rawValue)
    assertEquals("canvas.eval", OpenCraftCanvasCommand.Eval.rawValue)
    assertEquals("canvas.snapshot", OpenCraftCanvasCommand.Snapshot.rawValue)
  }

  @Test
  fun a2uiCommandsUseStableStrings() {
    assertEquals("canvas.a2ui.push", OpenCraftCanvasA2UICommand.Push.rawValue)
    assertEquals("canvas.a2ui.pushJSONL", OpenCraftCanvasA2UICommand.PushJSONL.rawValue)
    assertEquals("canvas.a2ui.reset", OpenCraftCanvasA2UICommand.Reset.rawValue)
  }

  @Test
  fun capabilitiesUseStableStrings() {
    assertEquals("canvas", OpenCraftCapability.Canvas.rawValue)
    assertEquals("camera", OpenCraftCapability.Camera.rawValue)
    assertEquals("voiceWake", OpenCraftCapability.VoiceWake.rawValue)
    assertEquals("location", OpenCraftCapability.Location.rawValue)
    assertEquals("sms", OpenCraftCapability.Sms.rawValue)
    assertEquals("device", OpenCraftCapability.Device.rawValue)
    assertEquals("notifications", OpenCraftCapability.Notifications.rawValue)
    assertEquals("system", OpenCraftCapability.System.rawValue)
    assertEquals("photos", OpenCraftCapability.Photos.rawValue)
    assertEquals("contacts", OpenCraftCapability.Contacts.rawValue)
    assertEquals("calendar", OpenCraftCapability.Calendar.rawValue)
    assertEquals("motion", OpenCraftCapability.Motion.rawValue)
    assertEquals("callLog", OpenCraftCapability.CallLog.rawValue)
  }

  @Test
  fun cameraCommandsUseStableStrings() {
    assertEquals("camera.list", OpenCraftCameraCommand.List.rawValue)
    assertEquals("camera.snap", OpenCraftCameraCommand.Snap.rawValue)
    assertEquals("camera.clip", OpenCraftCameraCommand.Clip.rawValue)
  }

  @Test
  fun notificationsCommandsUseStableStrings() {
    assertEquals("notifications.list", OpenCraftNotificationsCommand.List.rawValue)
    assertEquals("notifications.actions", OpenCraftNotificationsCommand.Actions.rawValue)
  }

  @Test
  fun deviceCommandsUseStableStrings() {
    assertEquals("device.status", OpenCraftDeviceCommand.Status.rawValue)
    assertEquals("device.info", OpenCraftDeviceCommand.Info.rawValue)
    assertEquals("device.permissions", OpenCraftDeviceCommand.Permissions.rawValue)
    assertEquals("device.health", OpenCraftDeviceCommand.Health.rawValue)
  }

  @Test
  fun systemCommandsUseStableStrings() {
    assertEquals("system.notify", OpenCraftSystemCommand.Notify.rawValue)
  }

  @Test
  fun photosCommandsUseStableStrings() {
    assertEquals("photos.latest", OpenCraftPhotosCommand.Latest.rawValue)
  }

  @Test
  fun contactsCommandsUseStableStrings() {
    assertEquals("contacts.search", OpenCraftContactsCommand.Search.rawValue)
    assertEquals("contacts.add", OpenCraftContactsCommand.Add.rawValue)
  }

  @Test
  fun calendarCommandsUseStableStrings() {
    assertEquals("calendar.events", OpenCraftCalendarCommand.Events.rawValue)
    assertEquals("calendar.add", OpenCraftCalendarCommand.Add.rawValue)
  }

  @Test
  fun motionCommandsUseStableStrings() {
    assertEquals("motion.activity", OpenCraftMotionCommand.Activity.rawValue)
    assertEquals("motion.pedometer", OpenCraftMotionCommand.Pedometer.rawValue)
  }

  @Test
  fun callLogCommandsUseStableStrings() {
    assertEquals("callLog.search", OpenCraftCallLogCommand.Search.rawValue)
  }
}
