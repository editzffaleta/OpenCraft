import Foundation
import Testing
@testable import OpenCraft

@Suite(.serialized) struct NodeServiceManagerTests {
    @Test func `builds node service commands with current CLI shape`() throws {
        let tmp = try makeTempDirForTests()
        CommandResolver.setProjectRoot(tmp.path)

        let opencraftPath = tmp.appendingPathComponent("node_modules/.bin/opencraft")
        try makeExecutableForTests(at: opencraftPath)

        let start = NodeServiceManager._testServiceCommand(["start"])
        #expect(start == [opencraftPath.path, "node", "start", "--json"])

        let stop = NodeServiceManager._testServiceCommand(["stop"])
        #expect(stop == [opencraftPath.path, "node", "stop", "--json"])
    }
}
