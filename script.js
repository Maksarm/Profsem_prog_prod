if (typeof BigNumber !== "undefined") {
    BigNumber.config({
        DECIMAL_PLACES: 1000,
        ROUNDING_MODE: BigNumber.ROUND_HALF_UP
    });
}

/*
 * Вычисляет квадратный корень.
 *
 * @param {string} numberStr - число в виде строки
 * @param {boolean} usePrecision - применять ли заданную точность
 * @param {number} precision - число знаков после запятой
 * @returns {string} результат в виде строки
 */
function squareRoot(numberStr, usePrecision, precision) {
    if (typeof numberStr !== "string") {
        throw new TypeError("Первый аргумент должен быть строкой");
    }

    if (typeof usePrecision !== "boolean") {
        throw new TypeError("Второй аргумент должен быть boolean");
    }

    if (!Number.isInteger(precision) || precision < 0) {
        throw new TypeError(
            "Число знаков после запятой должно быть неотрицательным целым числом"
        );
    }

    if (typeof BigNumber === "undefined") {
        throw new Error(
            "Не удалось загрузить математическую библиотеку BigNumber"
        );
    }

    const trimmed = numberStr
        .trim()
        .replace(/\s+/g, "")
        .replace(",", ".");

    if (trimmed === "") {
        throw new Error("Пустая строка не является числом");
    }

    const parsedNumber = parseComplexNumber(trimmed);

    const realPart = parsedNumber.real;
    const imaginaryPart = parsedNumber.imaginary;

    const formatResult = (value) => {
        const result = usePrecision
            ? value.toFixed(precision)
            : value.toString();

        return result.replace(".", ",");
    };

    const formatAbsoluteResult = (value) => {
        return formatResult(value.abs());
    };

    /*
     * Действительное число
     */
    if (imaginaryPart.isZero()) {
        if (realPart.isZero()) {
            return formatResult(new BigNumber(0));
        }

        if (realPart.isNegative()) {
            const imaginaryRoot = realPart.abs().squareRoot();
            const imaginaryResult = formatResult(imaginaryRoot);

            return `0 + ${imaginaryResult}i\n0 − ${imaginaryResult}i`;
        }

        return formatResult(realPart.squareRoot());
    }

    /*
     * Комплексные числа
     */
    const radius = realPart
        .times(realPart)
        .plus(imaginaryPart.times(imaginaryPart))
        .squareRoot();

    const realRoot = radius
        .plus(realPart)
        .dividedBy(2)
        .squareRoot();

    const imaginaryRootAbsolute = radius
        .minus(realPart)
        .dividedBy(2)
        .squareRoot();

    const imaginaryRoot = imaginaryPart.isNegative()
        ? imaginaryRootAbsolute.negated()
        : imaginaryRootAbsolute;

    const realResult = formatAbsoluteResult(realRoot);
    const imaginaryResult = formatAbsoluteResult(imaginaryRoot);

    const firstImaginarySign = imaginaryRoot.isNegative() ? "−" : "+";
    const secondImaginarySign = imaginaryRoot.isNegative() ? "+" : "−";
    const secondRealSign = realRoot.isZero() ? "" : "−";

    return [
        `${realResult} ${firstImaginarySign} ${imaginaryResult}i`,
        `${secondRealSign}${realResult} ${secondImaginarySign} ${imaginaryResult}i`
    ].join("\n");
}

function parseComplexNumber(value) {
    if (/^[+-]?infinity$/i.test(value)) {
        throw new Error(`Число "${value}" должно быть конечным`);
    }

    if (/^nan$/i.test(value)) {
        throw new Error(`"${value}" не является корректным числом`);
    }

    const unsignedNumberPattern =
        "(?:\\d+(?:\\.\\d*)?|\\.\\d+)(?:e[+-]?\\d+)?";

    const signedNumberPattern = `[+-]?${unsignedNumberPattern}`;

    const pureImaginaryPattern = new RegExp(
        `^([+-]?${unsignedNumberPattern})?i$`,
        "i"
    );

    const complexPattern = new RegExp(
        `^(${signedNumberPattern})?([+-])(${unsignedNumberPattern})i$`,
        "i"
    );

    let parsedResult;

    try {
        const pureImaginaryMatch = value.match(pureImaginaryPattern);

        if (pureImaginaryMatch) {
            const imaginaryValue = pureImaginaryMatch[1] || "1";

            parsedResult = {
                real: new BigNumber(0),
                imaginary: new BigNumber(imaginaryValue)
            };
        } else {
            const complexMatch = value.match(complexPattern);

            if (complexMatch) {
                const realValue = complexMatch[1] || "0";
                const sign = complexMatch[2];
                const imaginaryValue = complexMatch[3];

                const signedImaginaryValue =
                    sign === "-"
                        ? `-${imaginaryValue}`
                        : imaginaryValue;

                parsedResult = {
                    real: new BigNumber(realValue),
                    imaginary: new BigNumber(signedImaginaryValue)
                };
            } else {
                parsedResult = {
                    real: new BigNumber(value),
                    imaginary: new BigNumber(0)
                };
            }
        }
    } catch (error) {
        throw new Error(`"${value}" не является корректным числом`);
    }

    if (parsedResult.real.isNaN() || parsedResult.imaginary.isNaN()) {
        throw new Error(`"${value}" не является корректным числом`);
    }

    if (!parsedResult.real.isFinite() || !parsedResult.imaginary.isFinite()) {
        throw new Error(`Число "${value}" должно быть конечным`);
    }

    return parsedResult;
}

/*
 * Работа с интерфейсом
 */
document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("root-form");
    const numberInput = document.getElementById("number-input");
    const precisionToggle = document.getElementById("precision-toggle");
    const precisionInput = document.getElementById("precision-input");
    const precisionControl = document.querySelector(".precision-control");

    const result = document.getElementById("result");
    const resultValue = document.getElementById("result-value");
    const errorMessage = document.getElementById("error-message");

    if (
        !form ||
        !numberInput ||
        !precisionToggle ||
        !precisionInput ||
        !result ||
        !resultValue ||
        !errorMessage
    ) {
        console.error("Не найдены элементы калькулятора в index.html");
        return;
    }

    function updatePrecisionState() {
        const enabled = precisionToggle.checked;
        precisionInput.disabled = !enabled;

        if (precisionControl) {
            precisionControl.classList.toggle("disabled", !enabled);
        }
    }

    function clearMessages() {
        result.classList.remove("visible");
        errorMessage.classList.remove("visible");
        errorMessage.textContent = "";
    }

    function showError(message) {
        result.classList.remove("visible");
        errorMessage.textContent = message;
        errorMessage.classList.add("visible");
    }

    precisionToggle.addEventListener("change", updatePrecisionState);
    numberInput.addEventListener("input", clearMessages);

    form.addEventListener("submit", (event) => {
        event.preventDefault();
        clearMessages();

        try {
            const precision = Number(precisionInput.value);

            const calculatedResult = squareRoot(
                numberInput.value,
                precisionToggle.checked,
                precision
            );

            resultValue.textContent = calculatedResult;
            result.classList.add("visible");
        } catch (error) {
            showError(
                error instanceof Error
                    ? error.message
                    : "Не удалось выполнить вычисление"
            );
        }
    });

    updatePrecisionState();
});



/*
 * Unit-тесты
 */
(function runSelfTests() {
    let passed = 0;
    let failed = 0;

    function check(name, actual, expected) {
        if (actual === expected) {
            passed++;
            console.log(`✔ ${name}`);
        } else {
            failed++;
            console.error(
                `✘ ${name}\n  ожидалось: ${JSON.stringify(expected)}\n  получено:  ${JSON.stringify(actual)}`
            );
        }
    }

    function checkThrows(name, callback, expectedMessage) {
        try {
            callback();
            failed++;
            console.error(`✘ ${name}\n  ошибка не была выброшена`);
        } catch (error) {
            if (error instanceof Error && error.message === expectedMessage) {
                passed++;
                console.log(`✔ ${name}`);
            } else {
                failed++;
                console.error(
                    `✘ ${name}\n  ожидалось: ${JSON.stringify(expectedMessage)}\n  получено:  ${JSON.stringify(error && error.message)}`
                );
            }
        }
    }

    // --- Базовые корни ---
    check("корень из точного квадрата", squareRoot("144", true, 2), "12,00");
    check("корень из нуля", squareRoot("0", true, 2), "0,00");
    check(
        "корень из двойки с высокой точностью",
        squareRoot("2", true, 40),
        "1,4142135623730950488016887242096980785697"
    );
    check("корень без точности", squareRoot("144", false, 2), "12");
    check("десятичная запятая", squareRoot("2,25", true, 2), "1,50");

    // --- Отрицательные ---
    check(
        "комплексные корни -1000",
        squareRoot("-1000", true, 2),
        "0 + 31,62i\n0 − 31,62i"
    );
    check(
        "корни из -25",
        squareRoot("-25", true, 2),
        "0 + 5,00i\n0 − 5,00i"
    );

    // --- Комплексные ---
    check(
        "корень из 3i",
        squareRoot("3i", true, 2),
        "1,22 + 1,22i\n−1,22 − 1,22i"
    );
    check(
        "корень из -3i",
        squareRoot("-3i", true, 2),
        "1,22 − 1,22i\n−1,22 + 1,22i"
    );
    check(
        "мнимая единица",
        squareRoot("i", true, 2),
        "0,71 + 0,71i\n−0,71 − 0,71i"
    );
    check(
        "2+3i",
        squareRoot("2+3i", true, 2),
        "1,67 + 0,90i\n−1,67 − 0,90i"
    );
    check(
        "2 + 3i с пробелами",
        squareRoot("2 + 3i", true, 2),
        "1,67 + 0,90i\n−1,67 − 0,90i"
    );
    check(
        "2-3i",
        squareRoot("2-3i", true, 2),
        "1,67 − 0,90i\n−1,67 + 0,90i"
    );

    // --- Большие числа ---
    check(
        "очень большое число",
        squareRoot("10000000000000000000000000000000000000000", true, 2),
        "100000000000000000000,00"
    );

    const longResult = squareRoot("2", true, 100);
    check("длина длинного результата", longResult.length, 102);
    check(
        "начало длинного результата",
        longResult.startsWith("1,4142135623730950488016887242096980785696"),
        true
    );

    // --- Точность ---
    check("два знака", squareRoot("2", true, 2), "1,41");
    check("шесть знаков", squareRoot("2", true, 6), "1,414214");
    check("нулевая точность", squareRoot("2", true, 0), "1");

    // --- Ошибки ---
    checkThrows(
        "пустая строка",
        () => squareRoot("", true, 2),
        "Пустая строка не является числом"
    );
    checkThrows(
        "строка из пробелов",
        () => squareRoot("   ", true, 2),
        "Пустая строка не является числом"
    );
    checkThrows(
        "некорректное значение",
        () => squareRoot("hello", true, 2),
        '"hello" не является корректным числом'
    );
    checkThrows(
        "Infinity",
        () => squareRoot("Infinity", true, 2),
        'Число "Infinity" должно быть конечным'
    );
    checkThrows(
        "NaN",
        () => squareRoot("NaN", true, 2),
        '"NaN" не является корректным числом'
    );
    checkThrows(
        "первый аргумент не строка",
        () => squareRoot(2, true, 2),
        "Первый аргумент должен быть строкой"
    );
    checkThrows(
        "второй аргумент не boolean",
        () => squareRoot("2", "true", 2),
        "Второй аргумент должен быть boolean"
    );
    checkThrows(
        "отрицательная точность",
        () => squareRoot("2", true, -1),
        "Число знаков после запятой должно быть неотрицательным целым числом"
    );
    checkThrows(
        "дробная точность",
        () => squareRoot("2", true, 2.5),
        "Число знаков после запятой должно быть неотрицательным целым числом"
    );

    console.log(
        `%cТесты: ${passed} пройдено, ${failed} провалено`,
        `color: ${failed === 0 ? "green" : "red"}; font-weight: bold`
    );
})();