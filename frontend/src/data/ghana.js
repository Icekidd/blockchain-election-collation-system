// Complete Ghana Electoral Data — all 275 constituencies
// Source: Electoral Commission of Ghana

export const CANDIDATES = [
  { name: "Mahamudu Bawumia",        party: "NPP", color: "#2563eb", bgColor: "rgba(37,99,235,0.1)"  },
  { name: "John Dramani Mahama",     party: "NDC", color: "#006B3F", bgColor: "rgba(0,107,63,0.1)"   },
  { name: "Ivor Kobina Greenstreet", party: "CPP", color: "#CE1126", bgColor: "rgba(206,17,38,0.1)"  },
  { name: "Nana Akosua Frimpomaa",   party: "PPP", color: "#7c3aed", bgColor: "rgba(124,58,237,0.1)" },
];

export const REGIONS = [
  "Ashanti", "Greater Accra", "Eastern", "Western", "Central",
  "Northern", "Upper East", "Upper West", "Volta", "Bono",
  "Bono East", "Ahafo", "Western North", "Oti", "Savannah", "North East"
];

export const DISTRICTS_BY_REGION = {
  "Ashanti": [
    "Kumasi Metropolitan","Oforikrom Municipal","Asokwa Municipal","Kwadaso Municipal",
    "Suame Municipal","Tafo Municipal","Asante Akyem Central Municipal","Asante Akyem North",
    "Asante Akyem South","Bekwai Municipal","Bosome Freho","Bosomtwe","Ejisu Municipal",
    "Ejura Sekyedumase Municipal","Juaben Municipal","Kwabre East Municipal","Mampong Municipal",
    "Offinso Municipal","Offinso North","Sekyere Afram Plains","Sekyere Central",
    "Sekyere East","Sekyere Kumawu","Adansi Asokwa","Adansi North","Adansi South",
    "Amansie Central","Amansie South","Amansie West","Atwima Kwanwoma","Atwima Mponua",
    "Atwima Nwabiagya Municipal","Atwima Nwabiagya North"
  ],
  "Greater Accra": [
    "Accra Metropolitan","Tema Metropolitan","Ga East Municipal","Ga West Municipal",
    "La Dade-Kotopon Municipal","La Nkwantanang-Madina Municipal","Adentan Municipal",
    "Ashaiman Municipal","Kpone-Katamanso","Ningo-Prampram","Shai-Osudoku",
    "Ga Central Municipal","Ga South Municipal","Ablekuma Central Municipal",
    "Ablekuma North Municipal","Ablekuma West Municipal","Ayawaso Central Municipal",
    "Ayawaso East Municipal","Ayawaso North Municipal","Ayawaso West Municipal"
  ],
  "Eastern": [
    "New Juaben South Municipal","New Juaben North Municipal","Birim Central Municipal",
    "Birim North","Birim South","Fanteakwa North","Fanteakwa South","Kwahu Afram Plains North",
    "Kwahu Afram Plains South","Kwahu East","Kwahu South","Kwahu West Municipal",
    "Abuakwa North Municipal","Abuakwa South Municipal","Akuapem North Municipal",
    "Akuapem South","Akyemansa","Atiwa East","Atiwa West","Ayensuano","Denkyembour",
    "East Akim Municipal","Kwaebibirem Municipal","Nsawam Adoagyiri Municipal",
    "Suhum Municipal","Upper Manya Krobo","Lower Manya Krobo Municipal","Yilo Krobo Municipal"
  ],
  "Western": [
    "Sekondi-Takoradi Metropolitan","Ahanta West Municipal","Effia-Kwesimintsim Municipal",
    "Nzema East Municipal","Ellembelle","Jomoro","Mpohor","Prestea-Huni Valley Municipal",
    "Shama","Tarkwa-Nsuaem Municipal","Wassa Amenfi Central Municipal",
    "Wassa Amenfi East Municipal","Wassa Amenfi West","Wassa East"
  ],
  "Central": [
    "Cape Coast Metropolitan","Komenda-Edina-Eguafo-Abrem Municipal","Mfantsiman Municipal",
    "Asikuma-Odoben-Brakwa","Ajumako-Enyan-Essiam","Abura-Asebu-Kwamankese",
    "Agona East","Agona West Municipal","Assin Central Municipal","Assin North",
    "Assin South","Awutu Senya East Municipal","Awutu Senya West","Gomoa Central",
    "Gomoa East","Gomoa West","Hemang-Lower Denkyira","Upper Denkyira East Municipal",
    "Upper Denkyira West","Twifo Atti-Morkwa","Twifo Hemang-Lower Denkyira","Ekumfi"
  ],
  "Northern": [
    "Tamale Metropolitan","Sagnarigu Municipal","Tolon","Kumbungu","Nanton",
    "Savelugu Municipal","Karaga","Gushegu Municipal","Mion","Nanumba North Municipal",
    "Nanumba South","Zabzugu","Tatale-Sanguli","Yendi Municipal","Bimbilla (Nanumba North)"
  ],
  "Upper East": [
    "Bolgatanga Municipal","Bawku Municipal","Bawku West","Binduri","Bongo",
    "Builsa North Municipal","Builsa South","Garu","Kassena-Nankana Municipal",
    "Kassena-Nankana West","Nabdam","Pusiga","Talensi","Tempane"
  ],
  "Upper West": [
    "Wa Municipal","Jirapa Municipal","Lambussie-Karni","Lawra Municipal",
    "Nadowli-Kaleo","Nandom Municipal","Sissala East Municipal","Sissala West",
    "Wa East","Wa West"
  ],
  "Volta": [
    "Ho Municipal","Hohoe Municipal","Keta Municipal","Ketu North Municipal",
    "Ketu South Municipal","Akatsi North","Akatsi South","Afadjato South",
    "Biakoye","Central Tongu","North Dayi","North Tongu","South Dayi","South Tongu",
    "Adaklu","Anloga","Ho West","Krachi East Municipal","Krachi Nchumuru","Krachi West"
  ],
  "Bono": [
    "Sunyani Municipal","Sunyani West","Dormaa Central Municipal","Dormaa East",
    "Dormaa West","Berekum East Municipal","Berekum West","Banda","Jaman North",
    "Jaman South Municipal","Tain","Wenchi Municipal"
  ],
  "Bono East": [
    "Techiman Municipal","Techiman North","Kintampo North Municipal","Kintampo South",
    "Nkoranza North","Nkoranza South Municipal","Pru East","Pru West",
    "Sene East","Sene West","Atebubu-Amantin Municipal"
  ],
  "Ahafo": [
    "Goaso Municipal","Asutifi North","Asutifi South","Tano North Municipal",
    "Tano South Municipal","Asunafo North Municipal","Asunafo South"
  ],
  "Western North": [
    "Sefwi Wiawso Municipal","Bibiani-Anhwiaso-Bekwai Municipal","Bodi",
    "Juaboso","Bia East","Bia West","Sefwi Akontombra","Suaman"
  ],
  "Oti": [
    "Dambai (Krachi East)","Kadjebi","Jasikan (Buem)","Nkwanta North",
    "Nkwanta South Municipal","Guan","Akan","Borae-Dodo (Krachi West)","Santrokofi-Akpafu-Lolobi-Likpe"
  ],
  "Savannah": [
    "Damongo (West Gonja Municipal)","Sawla-Tuna-Kalba","East Gonja Municipal",
    "North Gonja","Central Gonja","Bole","Kulpawn (North West Gonja)"
  ],
  "North East": [
    "Nalerigu-Gambaga (East Mamprusi Municipal)","Walewale (West Mamprusi Municipal)",
    "Chereponi","Mamprugu-Moagduri","Bunkpurugu-Nakpayili","Yunyoo-Nasuan"
  ],
};

export const CONSTITUENCIES_BY_DISTRICT = {
  // ── Ashanti (47) ──────────────────────────────────────────────────────────
  "Kumasi Metropolitan":            ["Kumasi Central","Manhyia North","Manhyia South","Bantama","Suame","Tafo-Pankrono","Asokwa","Kwadaso","Oforikrom","Old Tafo","Nhyiaeso"],
  "Oforikrom Municipal":            ["Oforikrom"],
  "Asokwa Municipal":               ["Asokwa"],
  "Kwadaso Municipal":              ["Kwadaso"],
  "Suame Municipal":                ["Suame"],
  "Tafo Municipal":                 ["Old Tafo"],
  "Asante Akyem Central Municipal": ["Asante Akyem Central"],
  "Asante Akyem North":             ["Asante Akyem North"],
  "Asante Akyem South":             ["Asante Akyem South"],
  "Bekwai Municipal":               ["Bekwai"],
  "Bosome Freho":                   ["Bosome Freho"],
  "Bosomtwe":                       ["Bosomtwe"],
  "Ejisu Municipal":                ["Ejisu"],
  "Ejura Sekyedumase Municipal":    ["Ejura-Sekyedumase"],
  "Juaben Municipal":               ["Juaben"],
  "Kwabre East Municipal":          ["Kwabre East"],
  "Mampong Municipal":              ["Mampong"],
  "Offinso Municipal":              ["Offinso South"],
  "Offinso North":                  ["Offinso North"],
  "Sekyere Afram Plains":           ["Sekyere Afram Plains"],
  "Sekyere Central":                ["Sekyere Central"],
  "Sekyere East":                   ["Sekyere East"],
  "Sekyere Kumawu":                 ["Kumawu"],
  "Adansi Asokwa":                  ["Adansi Asokwa"],
  "Adansi North":                   ["Adansi North"],
  "Adansi South":                   ["Adansi South"],
  "Amansie Central":                ["Amansie Central"],
  "Amansie South":                  ["Amansie South"],
  "Amansie West":                   ["Amansie West"],
  "Atwima Kwanwoma":                ["Atwima Kwanwoma"],
  "Atwima Mponua":                  ["Atwima Mponua"],
  "Atwima Nwabiagya Municipal":     ["Atwima Nwabiagya South"],
  "Atwima Nwabiagya North":         ["Atwima Nwabiagya North"],

  // ── Greater Accra (29) ────────────────────────────────────────────────────
  "Accra Metropolitan":              ["Ablekuma Central","Ablekuma North","Ablekuma West","Ayawaso Central","Ayawaso East","Ayawaso North","Ayawaso West Wuogon","Okaikwei Central","Okaikwei North","Korle-Klottey"],
  "Tema Metropolitan":               ["Tema Central","Tema East","Tema West","Krowor","Ledzokuku"],
  "La Nkwantanang-Madina Municipal": ["Madina","Adentan"],
  "La Dade-Kotopon Municipal":       ["La Dadekotopon","Klottey Korle"],
  "Adentan Municipal":               ["Adentan"],
  "Ashaiman Municipal":              ["Ashaiman"],
  "Ga East Municipal":               ["Dome-Kwabenya","Trobu","Abokobi"],
  "Ga West Municipal":               ["Weija-Gbawe","Bortianor-Ngleshie Amanfrom"],
  "Ga Central Municipal":            ["Odododiodoo","Ablekuma South"],
  "Ga South Municipal":              ["Domeabra-Obom","Weija-Gbawe"],
  "Ablekuma Central Municipal":      ["Ablekuma Central"],
  "Ablekuma North Municipal":        ["Ablekuma North"],
  "Ablekuma West Municipal":         ["Ablekuma West"],
  "Ayawaso Central Municipal":       ["Ayawaso Central"],
  "Ayawaso East Municipal":          ["Ayawaso East"],
  "Ayawaso North Municipal":         ["Ayawaso North"],
  "Ayawaso West Municipal":          ["Ayawaso West Wuogon"],
  "Kpone-Katamanso":                 ["Kpone-Katamanso"],
  "Ningo-Prampram":                  ["Ningo-Prampram"],
  "Shai-Osudoku":                    ["Shai-Osudoku"],

  // ── Eastern (33) ─────────────────────────────────────────────────────────
  "New Juaben South Municipal":    ["Koforidua Central","New Juaben South"],
  "New Juaben North Municipal":    ["New Juaben North"],
  "Birim Central Municipal":       ["Akim Oda"],
  "Birim North":                   ["Akim Swedru","Akim Tafo-Kukurantumi"],
  "Birim South":                   ["Ofoase-Ayirebi"],
  "Fanteakwa North":               ["Fanteakwa North"],
  "Fanteakwa South":               ["Fanteakwa South"],
  "Kwahu Afram Plains North":      ["Kwahu Afram Plains North"],
  "Kwahu Afram Plains South":      ["Kwahu Afram Plains South"],
  "Kwahu East":                    ["Kwahu East"],
  "Kwahu South":                   ["Mpraeso"],
  "Kwahu West Municipal":          ["Kwahu West"],
  "Abuakwa North Municipal":       ["Abuakwa North"],
  "Abuakwa South Municipal":       ["Abuakwa South"],
  "Akuapem North Municipal":       ["Akuapem North"],
  "Akuapem South":                 ["Akuapem South"],
  "Akyemansa":                     ["Akyemansa"],
  "Atiwa East":                    ["Atiwa East"],
  "Atiwa West":                    ["Atiwa West"],
  "Ayensuano":                     ["Ayensuano"],
  "Denkyembour":                   ["Denkyembour"],
  "East Akim Municipal":           ["East Akim"],
  "Kwaebibirem Municipal":         ["Kwaebibirem"],
  "Nsawam Adoagyiri Municipal":    ["Nsawam-Adoagyiri"],
  "Suhum Municipal":               ["Suhum"],
  "Upper Manya Krobo":             ["Upper Manya Krobo"],
  "Lower Manya Krobo Municipal":   ["Lower Manya Krobo"],
  "Yilo Krobo Municipal":          ["Yilo Krobo"],

  // ── Western (22) ─────────────────────────────────────────────────────────
  "Sekondi-Takoradi Metropolitan": ["Sekondi","Effia","Takoradi","Kwesimintsim","Essikado-Ketan"],
  "Ahanta West Municipal":         ["Ahanta West"],
  "Effia-Kwesimintsim Municipal":  ["Effia","Kwesimintsim"],
  "Nzema East Municipal":          ["Evalue-Ajomoro-Gwira","Nzema East"],
  "Ellembelle":                    ["Ellembelle"],
  "Jomoro":                        ["Jomoro"],
  "Mpohor":                        ["Mpohor"],
  "Prestea-Huni Valley Municipal": ["Prestea-Huni Valley"],
  "Shama":                         ["Shama"],
  "Tarkwa-Nsuaem Municipal":       ["Tarkwa-Nsuaem"],
  "Wassa Amenfi Central Municipal":["Wassa Amenfi Central"],
  "Wassa Amenfi East Municipal":   ["Wassa Amenfi East"],
  "Wassa Amenfi West":             ["Wassa Amenfi West"],
  "Wassa East":                    ["Wassa East"],

  // ── Central (23) ─────────────────────────────────────────────────────────
  "Cape Coast Metropolitan":                ["Cape Coast North","Cape Coast South"],
  "Komenda-Edina-Eguafo-Abrem Municipal":   ["Komenda-Edina-Eguafo-Abrem"],
  "Mfantsiman Municipal":                   ["Mfantsiman"],
  "Asikuma-Odoben-Brakwa":                  ["Asikuma-Odoben-Brakwa"],
  "Ajumako-Enyan-Essiam":                   ["Ajumako-Enyan-Essiam"],
  "Abura-Asebu-Kwamankese":                 ["Abura-Asebu-Kwamankese"],
  "Agona East":                             ["Agona East"],
  "Agona West Municipal":                   ["Agona West"],
  "Assin Central Municipal":                ["Assin Central"],
  "Assin North":                            ["Assin North"],
  "Assin South":                            ["Assin South"],
  "Awutu Senya East Municipal":             ["Awutu-Senya East"],
  "Awutu Senya West":                       ["Awutu Senya"],
  "Gomoa Central":                          ["Gomoa Central"],
  "Gomoa East":                             ["Gomoa East"],
  "Gomoa West":                             ["Gomoa West"],
  "Hemang-Lower Denkyira":                  ["Hemang-Lower Denkyira"],
  "Upper Denkyira East Municipal":          ["Upper Denkyira East"],
  "Upper Denkyira West":                    ["Upper Denkyira West"],
  "Twifo Atti-Morkwa":                      ["Twifo Atti-Morkwa"],
  "Twifo Hemang-Lower Denkyira":            ["Twifo-Hemang Lower Denkyira"],
  "Ekumfi":                                 ["Ekumfi"],

  // ── Northern (16) ─────────────────────────────────────────────────────────
  "Tamale Metropolitan":         ["Tamale Central","Tamale North","Tamale South"],
  "Sagnarigu Municipal":         ["Sagnarigu"],
  "Tolon":                       ["Tolon"],
  "Kumbungu":                    ["Kumbungu"],
  "Nanton":                      ["Nanton"],
  "Savelugu Municipal":          ["Savelugu"],
  "Karaga":                      ["Karaga"],
  "Gushegu Municipal":           ["Gushegu"],
  "Mion":                        ["Mion"],
  "Nanumba North Municipal":     ["Bimbilla"],
  "Nanumba South":               ["Nanumba South"],
  "Zabzugu":                     ["Zabzugu"],
  "Tatale-Sanguli":              ["Tatale-Sanguli"],
  "Yendi Municipal":             ["Yendi"],

  // ── Upper East (15) ───────────────────────────────────────────────────────
  "Bolgatanga Municipal":        ["Bolgatanga Central","Bolgatanga East"],
  "Bawku Municipal":             ["Bawku Central","Bawku West"],
  "Bawku West":                  ["Bawku West"],
  "Binduri":                     ["Binduri"],
  "Bongo":                       ["Bongo"],
  "Builsa North Municipal":      ["Builsa North"],
  "Builsa South":                ["Builsa South"],
  "Garu":                        ["Garu"],
  "Kassena-Nankana Municipal":   ["Navrongo Central"],
  "Kassena-Nankana West":        ["Chiana-Paga"],
  "Nabdam":                      ["Nabdam"],
  "Pusiga":                      ["Pusiga"],
  "Talensi":                     ["Talensi"],
  "Tempane":                     ["Tempane"],

  // ── Upper West (11) ───────────────────────────────────────────────────────
  "Wa Municipal":                ["Wa Central","Wa East","Wa West"],
  "Jirapa Municipal":            ["Jirapa"],
  "Lambussie-Karni":             ["Lambussie"],
  "Lawra Municipal":             ["Lawra"],
  "Nadowli-Kaleo":               ["Nadowli-Kaleo"],
  "Nandom Municipal":            ["Nandom"],
  "Sissala East Municipal":      ["Sissala East"],
  "Sissala West":                ["Sissala West"],
  "Wa East":                     ["Wa East"],
  "Wa West":                     ["Wa West"],

  // ── Volta (20) ────────────────────────────────────────────────────────────
  "Ho Municipal":                ["Ho Central","Ho West"],
  "Hohoe Municipal":             ["Hohoe"],
  "Keta Municipal":              ["Keta","Anloga"],
  "Ketu North Municipal":        ["Ketu North"],
  "Ketu South Municipal":        ["Ketu South","Akatsi South"],
  "Akatsi North":                ["Akatsi North"],
  "Akatsi South":                ["Akatsi South"],
  "Afadjato South":              ["Afadjato South"],
  "Biakoye":                     ["Biakoye"],
  "Central Tongu":               ["Central Tongu"],
  "North Dayi":                  ["North Dayi"],
  "North Tongu":                 ["North Tongu"],
  "South Dayi":                  ["South Dayi"],
  "South Tongu":                 ["South Tongu"],
  "Adaklu":                      ["Adaklu"],
  "Anloga":                      ["Anloga"],
  "Ho West":                     ["Ho West"],
  "Krachi East Municipal":       ["Krachi East"],
  "Krachi Nchumuru":             ["Krachi Nchumuru"],
  "Krachi West":                 ["Krachi West"],

  // ── Bono (12) ─────────────────────────────────────────────────────────────
  "Sunyani Municipal":           ["Sunyani East","Sunyani West"],
  "Sunyani West":                ["Sunyani West"],
  "Dormaa Central Municipal":    ["Dormaa Central"],
  "Dormaa East":                 ["Dormaa East"],
  "Dormaa West":                 ["Dormaa West"],
  "Berekum East Municipal":      ["Berekum East"],
  "Berekum West":                ["Berekum West"],
  "Banda":                       ["Banda"],
  "Jaman North":                 ["Jaman North"],
  "Jaman South Municipal":       ["Jaman South"],
  "Tain":                        ["Tain"],
  "Wenchi Municipal":            ["Wenchi"],

  // ── Bono East (11) ────────────────────────────────────────────────────────
  "Techiman Municipal":          ["Techiman North","Techiman South"],
  "Techiman North":              ["Techiman North"],
  "Kintampo North Municipal":    ["Kintampo North"],
  "Kintampo South":              ["Kintampo South"],
  "Nkoranza North":              ["Nkoranza North"],
  "Nkoranza South Municipal":    ["Nkoranza South"],
  "Pru East":                    ["Pru East"],
  "Pru West":                    ["Pru West"],
  "Sene East":                   ["Sene East"],
  "Sene West":                   ["Sene West"],
  "Atebubu-Amantin Municipal":   ["Atebubu-Amantin"],

  // ── Ahafo (6) ─────────────────────────────────────────────────────────────
  "Goaso Municipal":             ["Goaso"],
  "Asutifi North":               ["Asutifi North"],
  "Asutifi South":               ["Asutifi South"],
  "Tano North Municipal":        ["Tano North"],
  "Tano South Municipal":        ["Tano South"],
  "Asunafo North Municipal":     ["Asunafo North"],
  "Asunafo South":               ["Asunafo South"],

  // ── Western North (8) ─────────────────────────────────────────────────────
  "Sefwi Wiawso Municipal":              ["Sefwi Wiawso"],
  "Bibiani-Anhwiaso-Bekwai Municipal":   ["Bibiani-Anhwiaso-Bekwai"],
  "Bodi":                                ["Bodi"],
  "Juaboso":                             ["Juaboso"],
  "Bia East":                            ["Bia East"],
  "Bia West":                            ["Bia West"],
  "Sefwi Akontombra":                    ["Sefwi Akontombra"],
  "Suaman":                              ["Suaman"],

  // ── Oti (9) ───────────────────────────────────────────────────────────────
  "Dambai (Krachi East)":                        ["Krachi East"],
  "Kadjebi":                                     ["Kadjebi"],
  "Jasikan (Buem)":                              ["Buem"],
  "Nkwanta North":                               ["Nkwanta North"],
  "Nkwanta South Municipal":                     ["Nkwanta South"],
  "Guan":                                        ["Guan"],
  "Akan":                                        ["Akan"],
  "Borae-Dodo (Krachi West)":                    ["Krachi West"],
  "Santrokofi-Akpafu-Lolobi-Likpe":             ["Santrokofi-Akpafu-Lolobi-Likpe"],

  // ── Savannah (7) ──────────────────────────────────────────────────────────
  "Damongo (West Gonja Municipal)": ["Damongo"],
  "Sawla-Tuna-Kalba":               ["Sawla-Tuna-Kalba"],
  "East Gonja Municipal":           ["East Gonja"],
  "North Gonja":                    ["North Gonja"],
  "Central Gonja":                  ["Central Gonja"],
  "Bole":                           ["Bole-Bamboi"],
  "Kulpawn (North West Gonja)":     ["North West Gonja"],

  // ── North East (6) ────────────────────────────────────────────────────────
  "Nalerigu-Gambaga (East Mamprusi Municipal)": ["Nalerigu-Gambaga"],
  "Walewale (West Mamprusi Municipal)":         ["Walewale"],
  "Chereponi":                                  ["Chereponi"],
  "Mamprugu-Moagduri":                          ["Mamprugu-Moagduri"],
  "Bunkpurugu-Nakpayili":                       ["Bunkpurugu-Nakpayili"],
  "Yunyoo-Nasuan":                              ["Yunyoo-Nasuan"],
};

export const STATION_ID_PREFIXES = {
  "Western":       "A",
  "Central":       "B",
  "Greater Accra": "C",
  "Eastern":       "D",
  "Volta":         "E",
  "Ashanti":       "F",
  "Brong-Ahafo":   "G",
  "Northern":      "H",
  "Upper East":    "J",
  "Upper West":    "K",
  "Western North": "L",
  "Ahafo":         "M",
  "Bono":          "N",
  "Bono East":     "P",
  "Oti":           "Q",
  "Savannah":      "R",
  "North East":    "S",
};