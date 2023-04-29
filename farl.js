/** @type {HTMLDivElement} */
const container = document.getElementById("container");

/** @type {HTMLInputElement} */
const glyphField = document.getElementById("character");

/** @type {HTMLInputElement} */
const unicodeField = document.getElementById("unicode");

/** @type {HTMLAnchorElement} */
const nameLink = document.getElementById("name-clickable");

/** @type {HTMLSpanElement} */
const nameSpan = document.getElementById("name-unclickable");

/** @type {HTMLSpanElement} */
const copyConfirmation = document.getElementById("copy-confirmation");

/** @type {HTMLSpanElement} */
const proOnlyInfo = document.getElementById("pro-only");

/** @type {HTMLSpanElement} */
const versionInfo = document.getElementById("version-info");

const request = new XMLHttpRequest();

const query = {
    query: `
        query {
            release (version: "6.x") {
                version
                icons {
                    id
                    unicode
                    familyStylesByLicense {
                        free {
                            family
                        }
                    }
                }
            }
        }
    `
};

const unicodeToId = {};

request.open("POST", "https://api.fontawesome.com");
request.setRequestHeader("Content-Type", "application/json");
request.onload = onRequestCompleted;
request.send(JSON.stringify(query));

function onRequestCompleted() {
    const response = JSON.parse(request.response);
    const icons = response.data.release.icons;

    container.classList.remove("loading");
    versionInfo.innerText = response.data.release.version;

    for (const icon of icons) {
        unicodeToId[parseInt(icon.unicode, 16)] = {
            id: icon.id,
            proOnly: icon.familyStylesByLicense.free.length === 0
        };
    }

    setIcon(undefined);

    glyphField.oninput = () => {
        if (glyphField.value.length >= 1) {
            const charCode = glyphField.value.toUpperCase().charCodeAt(0);
            setIcon(charCode);
        } else {
            setIcon(undefined);
        }
    }

    glyphField.onpaste = (event) => {
        event.preventDefault();
        event.stopPropagation();
        glyphField.value = event.clipboardData.getData("text");
        glyphField.oninput();
    }

    unicodeField.oninput = () => {
        const unicode = parseInt(extractUnicodeDigits(unicodeField.value), 16);
        setIcon(unicode);
    }

    unicodeField.onpaste = (event) => {
        event.preventDefault();
        event.stopPropagation();
        unicodeField.value = event.clipboardData.getData("text");
        unicodeField.oninput();
    }

    document.onpaste = (event) => {
        const pasted = event.clipboardData.getData("text");

        if (pasted.length === 1) {
            glyphField.onpaste(event);
        } else {
            const asUnicode = extractUnicodeDigits(pasted);
            if (asUnicode?.length >= 2 && !pasted.startsWith("fa-")) {
                unicodeField.onpaste(event);
            }
        }

    }
}

function extractUnicodeDigits(string) {
    const regex = /[a-f0-9]{1,4}/gi;
    const matches = string.match(regex);
    const unicode = matches ? matches[0] : undefined;

    return unicode;
}

function setIcon(unicode) {
    if (unicode) {
        const icon = unicodeToId[unicode];
        const iconName = icon?.id;

        glyphField.value = String.fromCharCode(unicode);
        unicodeField.value = unicode.toString(16);

        nameLink.innerText = nameSpan.innerText = iconName ? "fa-" + iconName : "N/A";
        nameLink.href = iconName ? "https://fontawesome.com/icons/" + iconName : "";
        proOnlyInfo.classList.toggle("show", icon?.proOnly === true);
    } else {
        glyphField.value = "";
        unicodeField.value = "";
        nameLink.innerText = "";
        nameSpan.innerText = "";
        nameLink.href = "";
        proOnlyInfo.classList.remove("show");
    }
}

const copyConfirmationAnimation = copyConfirmation.animate([{ opacity: 1 }, { opacity: 1, offset: 0.8 }, { opacity: 0 }], 1500);
copyConfirmationAnimation.finish();

function copyName() {
    navigator.clipboard.writeText(nameLink.innerText).then(() => {
        copyConfirmationAnimation.finish();
        copyConfirmationAnimation.play();
    });
}