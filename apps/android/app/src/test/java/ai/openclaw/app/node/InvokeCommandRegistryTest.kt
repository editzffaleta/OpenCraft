package ai.opencraft.app.node

import ai.opencraft.app.protocol.OpenCraftCalendarCommand
import ai.opencraft.app.protocol.OpenCraftCameraCommand
import ai.opencraft.app.protocol.OpenCraftCallLogCommand
import ai.opencraft.app.protocol.OpenCraftCapability
import ai.opencraft.app.protocol.OpenCraftContactsCommand
import ai.opencraft.app.protocol.OpenCraftDeviceCommand
import ai.opencraft.app.protocol.OpenCraftLocationCommand
import ai.opencraft.app.protocol.OpenCraftMotionCommand
import ai.opencraft.app.protocol.OpenCraftNotificationsCommand
import ai.opencraft.app.protocol.OpenCraftPhotosCommand
import ai.opencraft.app.protocol.OpenCraftSmsCommand
import ai.opencraft.app.protocol.OpenCraftSystemCommand
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class InvokeCommandRegistryTest {
  private val coreCapabilities =
    setOf(
      OpenCraftCapability.Canvas.rawValue,
      OpenCraftCapability.Device.rawValue,
      OpenCraftCapability.Notifications.rawValue,
      OpenCraftCapability.System.rawValue,
      OpenCraftCapability.Photos.rawValue,
      OpenCraftCapability.Contacts.rawValue,
      OpenCraftCapability.Calendar.rawValue,
      OpenCraftCapability.CallLog.rawValue,
    )

  private val optionalCapabilities =
    setOf(
      OpenCraftCapability.Camera.rawValue,
      OpenCraftCapability.Location.rawValue,
      OpenCraftCapability.Sms.rawValue,
      OpenCraftCapability.VoiceWake.rawValue,
      OpenCraftCapability.Motion.rawValue,
    )

  private val coreCommands =
    setOf(
      OpenCraftDeviceCommand.Status.rawValue,
      OpenCraftDeviceCommand.Info.rawValue,
      OpenCraftDeviceCommand.Permissions.rawValue,
      OpenCraftDeviceCommand.Health.rawValue,
      OpenCraftNotificationsCommand.List.rawValue,
      OpenCraftNotificationsCommand.Actions.rawValue,
      OpenCraftSystemCommand.Notify.rawValue,
      OpenCraftPhotosCommand.Latest.rawValue,
      OpenCraftContactsCommand.Search.rawValue,
      OpenCraftContactsCommand.Add.rawValue,
      OpenCraftCalendarCommand.Events.rawValue,
      OpenCraftCalendarCommand.Add.rawValue,
      OpenCraftCallLogCommand.Search.rawValue,
    )

  private val optionalCommands =
    setOf(
      OpenCraftCameraCommand.Snap.rawValue,
      OpenCraftCameraCommand.Clip.rawValue,
      OpenCraftCameraCommand.List.rawValue,
      OpenCraftLocationCommand.Get.rawValue,
      OpenCraftMotionCommand.Activity.rawValue,
      OpenCraftMotionCommand.Pedometer.rawValue,
      OpenCraftSmsCommand.Send.rawValue,
    )

  private val debugCommands = setOf("debug.logs", "debug.ed25519")

  @Test
  fun advertisedCapabilities_respectsFeatureAvailability() {
    val capabilities = InvokeCommandRegistry.advertisedCapabilities(defaultFlags())

    assertContainsAll(capabilities, coreCapabilities)
    assertMissingAll(capabilities, optionalCapabilities)
  }

  @Test
  fun advertisedCapabilities_includesFeatureCapabilitiesWhenEnabled() {
    val capabilities =
      InvokeCommandRegistry.advertisedCapabilities(
        defaultFlags(
          cameraEnabled = true,
          locationEnabled = true,
          smsAvailable = true,
          voiceWakeEnabled = true,
          motionActivityAvailable = true,
          motionPedometerAvailable = true,
        ),
      )

    assertContainsAll(capabilities, coreCapabilities + optionalCapabilities)
  }

  @Test
  fun advertisedCommands_respectsFeatureAvailability() {
    val commands = InvokeCommandRegistry.advertisedCommands(defaultFlags())

    assertContainsAll(commands, coreCommands)
    assertMissingAll(commands, optionalCommands + debugCommands)
  }

  @Test
  fun advertisedCommands_includesFeatureCommandsWhenEnabled() {
    val commands =
      InvokeCommandRegistry.advertisedCommands(
        defaultFlags(
          cameraEnabled = true,
          locationEnabled = true,
          smsAvailable = true,
          motionActivityAvailable = true,
          motionPedometerAvailable = true,
          debugBuild = true,
        ),
      )

    assertContainsAll(commands, coreCommands + optionalCommands + debugCommands)
  }

  @Test
  fun advertisedCommands_onlyIncludesSupportedMotionCommands() {
    val commands =
      InvokeCommandRegistry.advertisedCommands(
        NodeRuntimeFlags(
          cameraEnabled = false,
          locationEnabled = false,
          smsAvailable = false,
          voiceWakeEnabled = false,
          motionActivityAvailable = true,
          motionPedometerAvailable = false,
          debugBuild = false,
        ),
      )

    assertTrue(commands.contains(OpenCraftMotionCommand.Activity.rawValue))
    assertFalse(commands.contains(OpenCraftMotionCommand.Pedometer.rawValue))
  }

  private fun defaultFlags(
    cameraEnabled: Boolean = false,
    locationEnabled: Boolean = false,
    smsAvailable: Boolean = false,
    voiceWakeEnabled: Boolean = false,
    motionActivityAvailable: Boolean = false,
    motionPedometerAvailable: Boolean = false,
    debugBuild: Boolean = false,
  ): NodeRuntimeFlags =
    NodeRuntimeFlags(
      cameraEnabled = cameraEnabled,
      locationEnabled = locationEnabled,
      smsAvailable = smsAvailable,
      voiceWakeEnabled = voiceWakeEnabled,
      motionActivityAvailable = motionActivityAvailable,
      motionPedometerAvailable = motionPedometerAvailable,
      debugBuild = debugBuild,
    )

  private fun assertContainsAll(actual: List<String>, expected: Set<String>) {
    expected.forEach { value -> assertTrue(actual.contains(value)) }
  }

  private fun assertMissingAll(actual: List<String>, forbidden: Set<String>) {
    forbidden.forEach { value -> assertFalse(actual.contains(value)) }
  }
}
