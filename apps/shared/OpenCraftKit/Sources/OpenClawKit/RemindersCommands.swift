import Foundation

public enum OpenCraftRemindersCommand: String, Codable, Sendable {
    case list = "reminders.list"
    case add = "reminders.add"
}

public enum OpenCraftReminderStatusFilter: String, Codable, Sendable {
    case incomplete
    case completed
    case all
}

public struct OpenCraftRemindersListParams: Codable, Sendable, Equatable {
    public var status: OpenCraftReminderStatusFilter?
    public var limit: Int?

    public init(status: OpenCraftReminderStatusFilter? = nil, limit: Int? = nil) {
        self.status = status
        self.limit = limit
    }
}

public struct OpenCraftRemindersAddParams: Codable, Sendable, Equatable {
    public var title: String
    public var dueISO: String?
    public var notes: String?
    public var listId: String?
    public var listName: String?

    public init(
        title: String,
        dueISO: String? = nil,
        notes: String? = nil,
        listId: String? = nil,
        listName: String? = nil)
    {
        self.title = title
        self.dueISO = dueISO
        self.notes = notes
        self.listId = listId
        self.listName = listName
    }
}

public struct OpenCraftReminderPayload: Codable, Sendable, Equatable {
    public var identifier: String
    public var title: String
    public var dueISO: String?
    public var completed: Bool
    public var listName: String?

    public init(
        identifier: String,
        title: String,
        dueISO: String? = nil,
        completed: Bool,
        listName: String? = nil)
    {
        self.identifier = identifier
        self.title = title
        self.dueISO = dueISO
        self.completed = completed
        self.listName = listName
    }
}

public struct OpenCraftRemindersListPayload: Codable, Sendable, Equatable {
    public var reminders: [OpenCraftReminderPayload]

    public init(reminders: [OpenCraftReminderPayload]) {
        self.reminders = reminders
    }
}

public struct OpenCraftRemindersAddPayload: Codable, Sendable, Equatable {
    public var reminder: OpenCraftReminderPayload

    public init(reminder: OpenCraftReminderPayload) {
        self.reminder = reminder
    }
}
