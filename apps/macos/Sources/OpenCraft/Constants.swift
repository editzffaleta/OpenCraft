import Foundation

// Stable identifier used for both the macOS LaunchAgent label and Nix-managed defaults suite.
// nix-opencraft writes app defaults into this suite to survive app bundle identifier churn.
let launchdLabel = "ai.opencraft.mac"
let gatewayLaunchdLabel = "ai.opencraft.gateway"
let onboardingVersionKey = "opencraft.onboardingVersion"
let onboardingSeenKey = "opencraft.onboardingSeen"
let currentOnboardingVersion = 7
let pauseDefaultsKey = "opencraft.pauseEnabled"
let iconAnimationsEnabledKey = "opencraft.iconAnimationsEnabled"
let swabbleEnabledKey = "opencraft.swabbleEnabled"
let swabbleTriggersKey = "opencraft.swabbleTriggers"
let voiceWakeTriggerChimeKey = "opencraft.voiceWakeTriggerChime"
let voiceWakeSendChimeKey = "opencraft.voiceWakeSendChime"
let showDockIconKey = "opencraft.showDockIcon"
let defaultVoiceWakeTriggers = ["opencraft"]
let voiceWakeMaxWords = 32
let voiceWakeMaxWordLength = 64
let voiceWakeMicKey = "opencraft.voiceWakeMicID"
let voiceWakeMicNameKey = "opencraft.voiceWakeMicName"
let voiceWakeLocaleKey = "opencraft.voiceWakeLocaleID"
let voiceWakeAdditionalLocalesKey = "opencraft.voiceWakeAdditionalLocaleIDs"
let voicePushToTalkEnabledKey = "opencraft.voicePushToTalkEnabled"
let talkEnabledKey = "opencraft.talkEnabled"
let iconOverrideKey = "opencraft.iconOverride"
let connectionModeKey = "opencraft.connectionMode"
let remoteTargetKey = "opencraft.remoteTarget"
let remoteIdentityKey = "opencraft.remoteIdentity"
let remoteProjectRootKey = "opencraft.remoteProjectRoot"
let remoteCliPathKey = "opencraft.remoteCliPath"
let canvasEnabledKey = "opencraft.canvasEnabled"
let cameraEnabledKey = "opencraft.cameraEnabled"
let systemRunPolicyKey = "opencraft.systemRunPolicy"
let systemRunAllowlistKey = "opencraft.systemRunAllowlist"
let systemRunEnabledKey = "opencraft.systemRunEnabled"
let locationModeKey = "opencraft.locationMode"
let locationPreciseKey = "opencraft.locationPreciseEnabled"
let peekabooBridgeEnabledKey = "opencraft.peekabooBridgeEnabled"
let deepLinkKeyKey = "opencraft.deepLinkKey"
let modelCatalogPathKey = "opencraft.modelCatalogPath"
let modelCatalogReloadKey = "opencraft.modelCatalogReload"
let cliInstallPromptedVersionKey = "opencraft.cliInstallPromptedVersion"
let heartbeatsEnabledKey = "opencraft.heartbeatsEnabled"
let debugPaneEnabledKey = "opencraft.debugPaneEnabled"
let debugFileLogEnabledKey = "opencraft.debug.fileLogEnabled"
let appLogLevelKey = "opencraft.debug.appLogLevel"
let voiceWakeSupported: Bool = ProcessInfo.processInfo.operatingSystemVersion.majorVersion >= 26
