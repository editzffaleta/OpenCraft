package ai.opencraft.app.node

import ai.opencraft.app.protocol.OpenCraftCalendarCommand
import ai.opencraft.app.protocol.OpenCraftCanvasA2UICommand
import ai.opencraft.app.protocol.OpenCraftCanvasCommand
import ai.opencraft.app.protocol.OpenCraftCameraCommand
import ai.opencraft.app.protocol.OpenCraftCapability
import ai.opencraft.app.protocol.OpenCraftCallLogCommand
import ai.opencraft.app.protocol.OpenCraftContactsCommand
import ai.opencraft.app.protocol.OpenCraftDeviceCommand
import ai.opencraft.app.protocol.OpenCraftLocationCommand
import ai.opencraft.app.protocol.OpenCraftMotionCommand
import ai.opencraft.app.protocol.OpenCraftNotificationsCommand
import ai.opencraft.app.protocol.OpenCraftPhotosCommand
import ai.opencraft.app.protocol.OpenCraftSmsCommand
import ai.opencraft.app.protocol.OpenCraftSystemCommand

data class NodeRuntimeFlags(
  val cameraEnabled: Boolean,
  val locationEnabled: Boolean,
  val smsAvailable: Boolean,
  val voiceWakeEnabled: Boolean,
  val motionActivityAvailable: Boolean,
  val motionPedometerAvailable: Boolean,
  val debugBuild: Boolean,
)

enum class InvokeCommandAvailability {
  Always,
  CameraEnabled,
  LocationEnabled,
  SmsAvailable,
  MotionActivityAvailable,
  MotionPedometerAvailable,
  DebugBuild,
}

enum class NodeCapabilityAvailability {
  Always,
  CameraEnabled,
  LocationEnabled,
  SmsAvailable,
  VoiceWakeEnabled,
  MotionAvailable,
}

data class NodeCapabilitySpec(
  val name: String,
  val availability: NodeCapabilityAvailability = NodeCapabilityAvailability.Always,
)

data class InvokeCommandSpec(
  val name: String,
  val requiresForeground: Boolean = false,
  val availability: InvokeCommandAvailability = InvokeCommandAvailability.Always,
)

object InvokeCommandRegistry {
  val capabilityManifest: List<NodeCapabilitySpec> =
    listOf(
      NodeCapabilitySpec(name = OpenCraftCapability.Canvas.rawValue),
      NodeCapabilitySpec(name = OpenCraftCapability.Device.rawValue),
      NodeCapabilitySpec(name = OpenCraftCapability.Notifications.rawValue),
      NodeCapabilitySpec(name = OpenCraftCapability.System.rawValue),
      NodeCapabilitySpec(
        name = OpenCraftCapability.Camera.rawValue,
        availability = NodeCapabilityAvailability.CameraEnabled,
      ),
      NodeCapabilitySpec(
        name = OpenCraftCapability.Sms.rawValue,
        availability = NodeCapabilityAvailability.SmsAvailable,
      ),
      NodeCapabilitySpec(
        name = OpenCraftCapability.VoiceWake.rawValue,
        availability = NodeCapabilityAvailability.VoiceWakeEnabled,
      ),
      NodeCapabilitySpec(
        name = OpenCraftCapability.Location.rawValue,
        availability = NodeCapabilityAvailability.LocationEnabled,
      ),
      NodeCapabilitySpec(name = OpenCraftCapability.Photos.rawValue),
      NodeCapabilitySpec(name = OpenCraftCapability.Contacts.rawValue),
      NodeCapabilitySpec(name = OpenCraftCapability.Calendar.rawValue),
      NodeCapabilitySpec(
        name = OpenCraftCapability.Motion.rawValue,
        availability = NodeCapabilityAvailability.MotionAvailable,
      ),
      NodeCapabilitySpec(name = OpenCraftCapability.CallLog.rawValue),
    )

  val all: List<InvokeCommandSpec> =
    listOf(
      InvokeCommandSpec(
        name = OpenCraftCanvasCommand.Present.rawValue,
        requiresForeground = true,
      ),
      InvokeCommandSpec(
        name = OpenCraftCanvasCommand.Hide.rawValue,
        requiresForeground = true,
      ),
      InvokeCommandSpec(
        name = OpenCraftCanvasCommand.Navigate.rawValue,
        requiresForeground = true,
      ),
      InvokeCommandSpec(
        name = OpenCraftCanvasCommand.Eval.rawValue,
        requiresForeground = true,
      ),
      InvokeCommandSpec(
        name = OpenCraftCanvasCommand.Snapshot.rawValue,
        requiresForeground = true,
      ),
      InvokeCommandSpec(
        name = OpenCraftCanvasA2UICommand.Push.rawValue,
        requiresForeground = true,
      ),
      InvokeCommandSpec(
        name = OpenCraftCanvasA2UICommand.PushJSONL.rawValue,
        requiresForeground = true,
      ),
      InvokeCommandSpec(
        name = OpenCraftCanvasA2UICommand.Reset.rawValue,
        requiresForeground = true,
      ),
      InvokeCommandSpec(
        name = OpenCraftSystemCommand.Notify.rawValue,
      ),
      InvokeCommandSpec(
        name = OpenCraftCameraCommand.List.rawValue,
        requiresForeground = true,
        availability = InvokeCommandAvailability.CameraEnabled,
      ),
      InvokeCommandSpec(
        name = OpenCraftCameraCommand.Snap.rawValue,
        requiresForeground = true,
        availability = InvokeCommandAvailability.CameraEnabled,
      ),
      InvokeCommandSpec(
        name = OpenCraftCameraCommand.Clip.rawValue,
        requiresForeground = true,
        availability = InvokeCommandAvailability.CameraEnabled,
      ),
      InvokeCommandSpec(
        name = OpenCraftLocationCommand.Get.rawValue,
        availability = InvokeCommandAvailability.LocationEnabled,
      ),
      InvokeCommandSpec(
        name = OpenCraftDeviceCommand.Status.rawValue,
      ),
      InvokeCommandSpec(
        name = OpenCraftDeviceCommand.Info.rawValue,
      ),
      InvokeCommandSpec(
        name = OpenCraftDeviceCommand.Permissions.rawValue,
      ),
      InvokeCommandSpec(
        name = OpenCraftDeviceCommand.Health.rawValue,
      ),
      InvokeCommandSpec(
        name = OpenCraftNotificationsCommand.List.rawValue,
      ),
      InvokeCommandSpec(
        name = OpenCraftNotificationsCommand.Actions.rawValue,
      ),
      InvokeCommandSpec(
        name = OpenCraftPhotosCommand.Latest.rawValue,
      ),
      InvokeCommandSpec(
        name = OpenCraftContactsCommand.Search.rawValue,
      ),
      InvokeCommandSpec(
        name = OpenCraftContactsCommand.Add.rawValue,
      ),
      InvokeCommandSpec(
        name = OpenCraftCalendarCommand.Events.rawValue,
      ),
      InvokeCommandSpec(
        name = OpenCraftCalendarCommand.Add.rawValue,
      ),
      InvokeCommandSpec(
        name = OpenCraftMotionCommand.Activity.rawValue,
        availability = InvokeCommandAvailability.MotionActivityAvailable,
      ),
      InvokeCommandSpec(
        name = OpenCraftMotionCommand.Pedometer.rawValue,
        availability = InvokeCommandAvailability.MotionPedometerAvailable,
      ),
      InvokeCommandSpec(
        name = OpenCraftSmsCommand.Send.rawValue,
        availability = InvokeCommandAvailability.SmsAvailable,
      ),
      InvokeCommandSpec(
        name = OpenCraftCallLogCommand.Search.rawValue,
      ),
      InvokeCommandSpec(
        name = "debug.logs",
        availability = InvokeCommandAvailability.DebugBuild,
      ),
      InvokeCommandSpec(
        name = "debug.ed25519",
        availability = InvokeCommandAvailability.DebugBuild,
      ),
    )

  private val byNameInternal: Map<String, InvokeCommandSpec> = all.associateBy { it.name }

  fun find(command: String): InvokeCommandSpec? = byNameInternal[command]

  fun advertisedCapabilities(flags: NodeRuntimeFlags): List<String> {
    return capabilityManifest
      .filter { spec ->
        when (spec.availability) {
          NodeCapabilityAvailability.Always -> true
          NodeCapabilityAvailability.CameraEnabled -> flags.cameraEnabled
          NodeCapabilityAvailability.LocationEnabled -> flags.locationEnabled
          NodeCapabilityAvailability.SmsAvailable -> flags.smsAvailable
          NodeCapabilityAvailability.VoiceWakeEnabled -> flags.voiceWakeEnabled
          NodeCapabilityAvailability.MotionAvailable -> flags.motionActivityAvailable || flags.motionPedometerAvailable
        }
      }
      .map { it.name }
  }

  fun advertisedCommands(flags: NodeRuntimeFlags): List<String> {
    return all
      .filter { spec ->
        when (spec.availability) {
          InvokeCommandAvailability.Always -> true
          InvokeCommandAvailability.CameraEnabled -> flags.cameraEnabled
          InvokeCommandAvailability.LocationEnabled -> flags.locationEnabled
          InvokeCommandAvailability.SmsAvailable -> flags.smsAvailable
          InvokeCommandAvailability.MotionActivityAvailable -> flags.motionActivityAvailable
          InvokeCommandAvailability.MotionPedometerAvailable -> flags.motionPedometerAvailable
          InvokeCommandAvailability.DebugBuild -> flags.debugBuild
        }
      }
      .map { it.name }
  }
}
