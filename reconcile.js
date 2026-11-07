// Payment reconciliation.
//
// Reads payments.jsonl and works out how much money we actually collected.
// Run:  node reconcile.js


const fs = require("fs");

// Store the latest attempt for each transaction
const latestPayments = new Map();

const lines = fs.readFileSync("payments.jsonl", "utf8").split("\n");

for (const line of lines) {
    if (!line.trim()) continue;

    try {
        const event = JSON.parse(line);

        // Ignore events without a transaction ID
        if (!event.txn_id) continue;

        const previous = latestPayments.get(event.txn_id);

        // Keep only the latest attempt based on timestamp
        if (!previous || Date.parse(event.ts) >= Date.parse(previous.ts)) {
            latestPayments.set(event.txn_id, event);
        }

    } catch (error) {
        // Ignore invalid JSON lines
        continue;
    }
}

// Calculate successful payments only
let total = 0;
let count = 0;

for (const event of latestPayments.values()) {
    if (event.status === "success") {
        total += Number(String(event.amount).replace(/,/g, ""));
        count++;
    }
}

// Read expected successful payment count
const expected = parseInt(
    fs.readFileSync("expected.txt", "utf8").trim(),
    10
);

if (count !== expected) {
    console.log(
        `Check failed: counted ${count} successful payments, expected ${expected}.`
    );
    console.log(
        "Something in the data isn't being handled the right way"
    );
} else {
    console.log(`Check passed: ${count} successful payments.`);
    console.log(`Your code: KOYA-${Math.round(total)}`);
}
