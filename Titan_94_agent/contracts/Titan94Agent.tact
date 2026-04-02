import "@stdlib/deploy";

message Increment {
    amount: Int as uint32;
}

contract Titan94Agent with Deployable {
    owner: Address;
    counter: Int as uint32;

    init() {
        self.owner = sender();
        self.counter = 0;
    }

    receive(msg: Increment) {
        self.counter += msg.amount;
    }

    receive("reset") {
        require(sender() == self.owner, "Only owner can reset");
        self.counter = 0;
    }

    get fun counter(): Int {
        return self.counter;
    }

    get fun owner(): Address {
        return self.owner;
    }
}
