const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const assert = require("node:assert/strict");
const test = require("node:test");

const BigNumber = require("bignumber.js");

const scriptPath = path.join(__dirname, "..", "script.js");
const scriptCode = fs.readFileSync(scriptPath, "utf8");

const context = {
    BigNumber,

    document: {
        addEventListener() {
        }
    },

    console
};

vm.createContext(context);
vm.runInContext(scriptCode, context);

const squareRoot = context.squareRoot;

if (typeof squareRoot !== "function") {
    throw new Error(
        "Функция squareRoot не найдена в script.js"
    );
}

// Вспомогательная функция для проверки ошибок
function assertThrowsMessage(callback, expectedMessage) {
    assert.throws(callback, (error) => {
        assert.equal(error.message, expectedMessage);
        return true;
    });
}

// --------------------------------------------------
// Проверка базовых арифметических корней
// --------------------------------------------------

test("вычисляет корень из точного квадрата", () => {
    assert.equal(
        squareRoot("144", true, 2),
        "12,00"
    );
});

test("вычисляет корень из нуля", () => {
    assert.equal(
        squareRoot("0", true, 2),
        "0,00"
    );
});

test("вычисляет корень из двойки с высокой точностью", () => {
    assert.equal(
        squareRoot("2", true, 40),
        "1,4142135623730950488016887242096980785697"
    );
});

test("вычисляет корень без фиксированной точности", () => {
    assert.equal(
        squareRoot("144", false, 2),
        "12"
    );
});

test("поддерживает десятичную запятую", () => {
    assert.equal(
        squareRoot("2,25", true, 2),
        "1,50"
    );
});

// --------------------------------------------------
// Проверка отрицательных действительных чисел
// --------------------------------------------------

test("вычисляет комплексные корни отрицательного числа", () => {
    assert.equal(
        squareRoot("-1000", true, 2),
        "0 + 31,62i\n0 − 31,62i"
    );
});

test("вычисляет корни из отрицательного полного квадрата", () => {
    assert.equal(
        squareRoot("-25", true, 2),
        "0 + 5,00i\n0 − 5,00i"
    );
});

// --------------------------------------------------
// Проверка комплексных чисел
// --------------------------------------------------

test("вычисляет корень из чистого мнимого числа", () => {
    assert.equal(
        squareRoot("3i", true, 2),
        "1,22 + 1,22i\n−1,22 − 1,22i"
    );
});

test("поддерживает отрицательное чисто мнимое число", () => {
    assert.equal(
        squareRoot("-3i", true, 2),
        "1,22 − 1,22i\n−1,22 + 1,22i"
    );
});

test("поддерживает мнимую единицу", () => {
    assert.equal(
        squareRoot("i", true, 2),
        "0,71 + 0,71i\n−0,71 − 0,71i"
    );
});

test("поддерживает запись действительная часть плюс мнимая", () => {
    assert.equal(
        squareRoot("2+3i", true, 2),
        "1,67 + 0,90i\n−1,67 − 0,90i"
    );
});

test("поддерживает пробелы в комплексном числе", () => {
    assert.equal(
        squareRoot("2 + 3i", true, 2),
        "1,67 + 0,90i\n−1,67 − 0,90i"
    );
});

test("поддерживает отрицательную мнимую часть", () => {
    assert.equal(
        squareRoot("2-3i", true, 2),
        "1,67 − 0,90i\n−1,67 + 0,90i"
    );
});

// --------------------------------------------------
// Проверка длинных чисел
// --------------------------------------------------

test("работает с очень большим числом", () => {
    assert.equal(
        squareRoot("10000000000000000000000000000000000000000", true, 2),
        "100000000000000000000,00"
    );
});

test("сохраняет длинный результат", () => {
    const result = squareRoot("2", true, 100);

    assert.equal(result.length, 102);
    assert.match(
        result,
        /^1,4142135623730950488016887242096980785696/
    );
});

// --------------------------------------------------
// Проверка точности
// --------------------------------------------------
test("использует два знака после запятой", () => {
    assert.equal(
        squareRoot("2", true, 2),
        "1,41"
    );
});

test("использует шесть знаков после запятой", () => {
    assert.equal(
        squareRoot("2", true, 6),
        "1,414214"
    );
});

test("поддерживает нулевую точность", () => {
    assert.equal(
        squareRoot("2", true, 0),
        "1"
    );
});

// --------------------------------------------------
// Проверка ошибок
// --------------------------------------------------

test("отклоняет пустую строку", () => {
    assertThrowsMessage(
        () => squareRoot("", true, 2),
        "Пустая строка не является числом"
    );
});

test("отклоняет строку из пробелов", () => {
    assertThrowsMessage(
        () => squareRoot("   ", true, 2),
        "Пустая строка не является числом"
    );
});

test("отклоняет некорректное значение", () => {
    assertThrowsMessage(
        () => squareRoot("hello", true, 2),
        '"hello" не является корректным числом'
    );
});

test("отклоняет Infinity", () => {
    assertThrowsMessage(
        () => squareRoot("Infinity", true, 2),
        'Число "Infinity" должно быть конечным'
    );
});

test("отклоняет NaN", () => {
    assertThrowsMessage(
        () => squareRoot("NaN", true, 2),
        '"NaN" не является корректным числом'
    );
});

test("отклоняет неправильный тип первого аргумента", () => {
    assertThrowsMessage(
        () => squareRoot(2, true, 2),
        "Первый аргумент должен быть строкой"
    );
});

test("отклоняет неправильный тип второго аргумента", () => {
    assertThrowsMessage(
        () => squareRoot("2", "true", 2),
        "Второй аргумент должен быть boolean"
    );
});

test("отклоняет отрицательную точность", () => {
    assertThrowsMessage(
        () => squareRoot("2", true, -1),
        "Третий аргумент должен быть неотрицательным целым числом"
    );
});

test("отклоняет дробную точность", () => {
    assertThrowsMessage(
        () => squareRoot("2", true, 2.5),
        "Третий аргумент должен быть неотрицательным целым числом"
    );
});