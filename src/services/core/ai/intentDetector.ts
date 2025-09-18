export function detectIntent(question: string): "bill" | "diet" | "workout" | "general" {
    const q = question.toLowerCase();

    if (q.includes("bill") || q.includes("payment") || q.includes("due")) {
        return "bill";
    }

    if (q.includes("diet") || q.includes("food") || q.includes("nutrition")) {
        return "diet";
    }

    if (q.includes("workout") || q.includes("exercise") || q.includes("training")) {
        return "workout";
    }

    return "general";
}

