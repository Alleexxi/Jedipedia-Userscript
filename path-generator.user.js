// ==UserScript==
// @name         Path Converter
// @namespace    http://tampermonkey.net/
// @version      2024-12-29
// @description  try to take over the world!
// @author       ChatGPT, viewmatrix
// @match        https://swtor.jedipedia.net/en/npc/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=jedipedia.net
// @grant        none
// ==/UserScript==

const SlotName = {
    1: "age",
    2: "boot",
    3: "bracer",
    4: "chest",
    5: "complexion",
    6: "creature",
    7: "eye_color",
    8: "face",
    9: "face_hair",
    10: "face_paint",
    11: "hair",
    12: "hair_color",
    13: "hand",
    14: "head",
    15: "leg",
    16: "skin_color",
    17: "waist",
    18: "unknown",
    19: "garment_hue",
    20: "color_sheme",
    21: "main_hand",
    22: "off_hand",
}

const Derived = {
    2: "Creature",
    5: "Eye",
    6: "Garment",
    9: "HairC",
    11: "SkinB"
}

function getSlotById(id) {
    return SlotName[id] || "unknown"; // Default to "unknown" if the ID doesn't exist
}

let slots = []; // Array to store the slots later
let character_data = window.npp[0]; // Get the character data from the page
let slots_data = character_data.slots; // Get the slots data from the character data

let skin_data = character_data.skin
let mats_data = character_data.mats

console.log(mats_data)

// Loop through the character data
for (let i = 0; i < slots_data.length; i++) {
    let slot = slots_data[i]; // Get the current slot
    let type = slot.type; // Get the type of the slot

    // Get the name of the slot
    let mdls = slot.gr2;
    let name = mdls[0].split("/")[3];
    let slot_name = getSlotById(type); // Get the name of the slot
    if (slot_name == "unknown") {
        console.log("Slot: " + name + " " + type + " is unknown");
        break;
    }

    // Add the slot to the array
    slots[slot_name] = slot;
}

// Add this function to ensure paths have a leading slash
function ensureLeadingSlash(path) {
    if (!path) return path;
    return path.startsWith('/') ? path : '/' + path;
}


function gen_skinMats() {
    let materialEntries = [];

    for (const matKey in mats_data) {
        let slotName = matKey.split("_")[0]
        console.log(slotName)
        const mat = mats_data[matKey];

        // Get the derived type name
        const derivedType = mat.derived ? (Derived[mat.derived] || "Unknown") : "Unknown";

        if (derivedType === "SkinB") {
            const matEntry = {
                "slotName": slotName,
                "materialInfo": {
                    "derived": derivedType,
                    "alphaMode": mat.alphaMode === 4 ? "None" : mat.alphaMode.toString(),
                    "isTwoSided": mat.isTwoSided.toString(),
                    "audioMat": mat.audioMat === 0 ? "Default" : mat.audioMat.toString(),
                    "diffuseMap": ensureLeadingSlash(`${mat.texnameDiffuse + ".dds"}`),
                    "rotationMap": ensureLeadingSlash(`${mat.texnameRotation + ".dds"}`),
                    "glossMap": ensureLeadingSlash(`${mat.texnameGloss + ".dds"}`),
                    "paletteMap": ensureLeadingSlash(`${mat.texnamePalette + ".dds"}`),
                    "paletteMaskMap": ensureLeadingSlash(`${mat.texnamePaletteMask + ".dds"}`),
                    "palette1": Array.isArray(mat.palette1) ? [...mat.palette1] : ["1", "1", "1", "1"],
                    "palette2": Array.isArray(mat.palette2) ? [...mat.palette2] : ["1", "1", "1", "1"],
                    "palette1Specular": Array.isArray(mat.palette1Specular) ? [...mat.palette1Specular] : ["1", "1", "1"],
                    "palette2Specular": Array.isArray(mat.palette2Specular) ? [...mat.palette2Specular] : ["1", "1", "1"],
                    "palette1MetallicSpecular": Array.isArray(mat.palette1MetallicSpecular) ? [...mat.palette1MetallicSpecular] : [1, 1, 1],
                    "palette2MetallicSpecular": Array.isArray(mat.palette2MetallicSpecular) ? [...mat.palette2MetallicSpecular] : ["1", "1", "1"],
                    "flush": Array.isArray(mat.flush) ? [...mat.flush] : ["1", "1", "1"],
                    "fleshBrightness": "0.1",
                    "matPath": ensureLeadingSlash(`/art/shaders/materials/${matKey}.mat`)
                },
                "ddsPaths": {
                    "diffuseMap": ensureLeadingSlash(`${mat.texnameDiffuse + ".dds"}`),
                    "rotationMap": ensureLeadingSlash(`${mat.texnameRotation + ".dds"}`),
                    "glossMap": ensureLeadingSlash(`${mat.texnameGloss + ".dds"}`),
                    "paletteMap": ensureLeadingSlash(`${mat.texnamePalette + ".dds"}`),
                    "paletteMaskMap": ensureLeadingSlash(`${mat.texnamePaletteMask + ".dds"}`)
                },
                "otherValues": {
                    "derived": derivedType,
                    "flush": Array.isArray(mat.flush) ? [...mat.flush] : ["1", "1", "1"],
                    "fleshBrightness": "0.1",
                    "palette1": Array.isArray(mat.palette1) ? [...mat.palette1] : ["1", "1", "1", "1"],
                    "palette2": Array.isArray(mat.palette2) ? [...mat.palette2] : ["1", "1", "1", "1"],
                    "palette1Specular": Array.isArray(mat.palette1Specular) ? [...mat.palette1Specular] : [1, 1, 1],
                    "palette2Specular": Array.isArray(mat.palette2Specular) ? [...mat.palette2Specular] : ["1", "1", "1"],
                    "palette1MetallicSpecular": Array.isArray(mat.palette1MetallicSpecular) ? [...mat.palette1MetallicSpecular] : [1, 1, 1],
                    "palette2MetallicSpecular": Array.isArray(mat.palette2MetallicSpecular) ? [...mat.palette2MetallicSpecular] : ["1", "1", "1"]
                }
            };

            materialEntries.push(matEntry);
        }
    }

    const skinMatsObject = {
        "slotName": "skinMats",
        "models": [],
        "materialInfo": {
            "mats": materialEntries
        }
    };

    return skinMatsObject;
}

function gen_paths_json() {
    let entries = [];
    let skinMats = gen_skinMats();
    
    // Loop through all slots
    for (let i = 0; i < slots_data.length; i++) {
        let slot = slots_data[i];
        let type = slot.type;
        let slotName = getSlotById(type);
        
        // Skip if unknown slot
        if (slotName === "unknown") {
            console.log("Skipping unknown slot type: " + type);
            continue;
        }
        
        // Create entry object
        let entry = {
            "slotName": slotName,
            "models": slot.gr2.map(path => ensureLeadingSlash(path)),
            "materialInfo": {
                "matPath": "",
                "ddsPaths": {},
                "otherValues": {}
            }
        };
        
        // Handle materials
        if (slot.mats) {
            let matKey;
            // Choose the material (all or specific one)
            if (slot.mats.all) {
                matKey = slot.mats.all;
            } else if (Object.keys(slot.mats).length > 0) {
                matKey = slot.mats[Object.keys(slot.mats)[0]];
            }
            
            if (matKey && mats_data[matKey]) {
                const mat = mats_data[matKey];
                // Get derived type
                const derivedType = mat.derived ? (Derived[mat.derived] || "Unknown") : "Unknown";
                
                // Set material path
                entry.materialInfo.matPath = ensureLeadingSlash(`/art/shaders/materials/${matKey}.mat`);
                
                // Add texture paths
                entry.materialInfo.ddsPaths = {
                    "paletteMap": ensureLeadingSlash(`${mat.texnamePalette}.dds`),
                    "paletteMaskMap": ensureLeadingSlash(`${mat.texnamePaletteMask}.dds`),
                    "diffuseMap": ensureLeadingSlash(`${mat.texnameDiffuse}.dds`),
                    "glossMap": ensureLeadingSlash(`${mat.texnameGloss}.dds`),
                    "rotationMap": ensureLeadingSlash(`${mat.texnameRotation}.dds`)
                };

                if (slotName === "head") {
                    // Add complexion map if it exists in character_data
                    if (character_data.compl) {
                        entry.materialInfo.ddsPaths.complexionMap = ensureLeadingSlash(`${character_data.compl}`.replace('.png', '.dds'));
                    }
                    
                    // Add face paint map if it exists in character_data
                    if (character_data.face) {
                        entry.materialInfo.ddsPaths.facepaintMap = ensureLeadingSlash(`${character_data.face}`.replace('.png', '.dds'));
                    }
                    
                    // Add age map if it exists in character_data
                    if (character_data.age) {
                        entry.materialInfo.ddsPaths.ageMap = ensureLeadingSlash(`${character_data.age}`.replace('.png', '.dds'));
                    }
                }
                
                // Add other values
                entry.materialInfo.otherValues = {
                    "derived": derivedType,
                    "flush": Array.isArray(mat.flush) ? [...mat.flush] : [0, 0, 0],
                    "fleshBrightness": "0.1",
                    "palette1": Array.isArray(mat.palette1) ? [...mat.palette1] : [0, 0.5, 0, 1],
                    "palette2": Array.isArray(mat.palette2) ? [...mat.palette2] : [0, 0.5, 0, 1],
                    "palette1Specular": Array.isArray(mat.palette1Specular) ? [...mat.palette1Specular] : [1, 1, 1],
                    "palette2Specular": Array.isArray(mat.palette2Specular) ? [...mat.palette2Specular] : [1, 1, 1],
                    "palette1MetallicSpecular": Array.isArray(mat.palette1MetallicSpecular) ? [...mat.palette1MetallicSpecular] : [1, 1, 1],
                    "palette2MetallicSpecular": Array.isArray(mat.palette2MetallicSpecular) ? [...mat.palette2MetallicSpecular] : [1, 1, 1]
                };
                
                // Apply colors from prim/sec if available
                if (slot.prim) {
                    entry.materialInfo.otherValues.palette1 = slot.prim.p;
                    entry.materialInfo.otherValues.palette1Specular = slot.prim.s;
                    entry.materialInfo.otherValues.palette1MetallicSpecular = slot.prim.m;
                }
                
                if (slot.sec) {
                    entry.materialInfo.otherValues.palette2 = slot.sec.p;
                    entry.materialInfo.otherValues.palette2Specular = slot.sec.s;
                    entry.materialInfo.otherValues.palette2MetallicSpecular = slot.sec.m;
                }
                
                // Special case for head slot - add eye material info
                if ((slotName === "head" || slotName === "creature") && (slot.mats["1"] || slot.mats["eye"])) {
                    const eyeMatKey = slot.mats["1"] || slot.mats["eye"];
                    const eyeMat = mats_data[eyeMatKey];
                    
                    if (eyeMat) {
                        const eyeDerivedType = eyeMat.derived ? (Derived[eyeMat.derived] || "Unknown") : "Unknown";
                        
                        entry.materialInfo.eyeMatInfo = {
                            "ddsPaths": {
                                "paletteMap": ensureLeadingSlash(`${eyeMat.texnamePalette}.dds`),
                                "paletteMaskMap": ensureLeadingSlash(`${eyeMat.texnamePaletteMask}.dds`),
                                "diffuseMap": ensureLeadingSlash(`${eyeMat.texnameDiffuse}.dds`),
                                "glossMap": ensureLeadingSlash(`${eyeMat.texnameGloss}.dds`),
                                "rotationMap": ensureLeadingSlash(`${eyeMat.texnameRotation}.dds`)
                            },
                            "otherValues": {
                                "derived": eyeDerivedType,
                                "flush": Array.isArray(eyeMat.flush) ? [...eyeMat.flush] : [0, 0, 0],
                                "fleshBrightness": 0.1,
                                "palette1": Array.isArray(eyeMat.palette1) ? [...eyeMat.palette1] : [0, 0.5, 0, 1],
                                "palette2": Array.isArray(eyeMat.palette2) ? [...eyeMat.palette2] : [0, 0.5, 0, 1],
                                "palette1Specular": Array.isArray(eyeMat.palette1Specular) ? [...eyeMat.palette1Specular] : [1, 1, 1],
                                "palette2Specular": Array.isArray(eyeMat.palette2Specular) ? [...eyeMat.palette2Specular] : [1, 1, 1],
                                "palette1MetallicSpecular": Array.isArray(eyeMat.palette1MetallicSpecular) ? [...eyeMat.palette1MetallicSpecular] : [1, 1, 1],
                                "palette2MetallicSpecular": Array.isArray(eyeMat.palette2MetallicSpecular) ? [...eyeMat.palette2MetallicSpecular] : [1, 1, 1]
                            }
                        };
                        
                        // Apply eye colors if available in character_data
                        if (character_data.eye) {
                            entry.materialInfo.eyeMatInfo.otherValues.palette1 = character_data.eye.p;
                            entry.materialInfo.eyeMatInfo.otherValues.palette1Specular = character_data.eye.s;
                            entry.materialInfo.eyeMatInfo.otherValues.palette1MetallicSpecular = character_data.eye.m;
                        }
                    }
                }
            }
        }
        
        entries.push(entry);
    }
    
    // Add skinMats at the end
    entries.push(skinMats);
    
    return entries;
}
function get_skeleton() {
    // Path to skeleton name:
    const table = document.getElementById('npp0');
    if (!table) return "";

    const tbody = table.getElementsByTagName('tbody')[0];
    if (!tbody) return "";

    const rows = tbody.getElementsByTagName('tr');
    if (rows.length < 2) return "";

    const skeletonRow = rows[1]; // Get the second row
    if (!skeletonRow) return "";

    const cells = skeletonRow.getElementsByTagName('td');
    if (cells.length < 2) return "";

    const skeleton_name = cells[1].textContent.trim(); // Get the second cell's text

    // Extract the skeleton name and ensure it has 'new' suffix if needed
    let final_skeleton_name = skeleton_name;
    if (final_skeleton_name.length === 3) {
        final_skeleton_name += 'new';
    }

    // Return the skeleton object
    return {
        "path": `/art/dynamic/spec/${final_skeleton_name}_skeleton.gr2`
    };
}

async function do_stuff() {
    const pathsJson = gen_paths_json();
    const skeletonJson = get_skeleton();
    
    // Get character name from URL
    const url = window.location.href;
    const charName = url.split('/').pop();
    
    // Create JSZip instance
    const zip = new JSZip();
    
    // Add files to zip
    zip.file("paths.json", JSON.stringify(pathsJson, null, 4));
    zip.file("skeleton.json", JSON.stringify(skeletonJson, null, 4));
    
    // Generate zip and download
    const content = await zip.generateAsync({type: "blob"});
    const downloadUrl = URL.createObjectURL(content);
    
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", downloadUrl);
    downloadAnchorNode.setAttribute("download", `${charName}.zip`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    URL.revokeObjectURL(downloadUrl);
}

// Add a button to the page to trigger the conversion
function addButton() {
    // Add JSZip script
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
    document.head.appendChild(script);

    const button = document.createElement('button');
    button.textContent = 'Download Character ZIP';
    button.style.position = 'fixed';
    button.style.top = '10px';
    button.style.right = '10px';
    button.style.zIndex = '9999';
    button.style.padding = '10px';
    button.style.backgroundColor = '#4CAF50';
    button.style.color = 'white';
    button.style.border = 'none';
    button.style.borderRadius = '4px';
    button.style.cursor = 'pointer';
    
    button.addEventListener('click', do_stuff);
    document.body.appendChild(button);
}

// Run when the page loads
(function() {
    console.log('Path Converter script loaded');
    addButton();
})();
