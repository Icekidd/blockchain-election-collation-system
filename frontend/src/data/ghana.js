export const CANDIDATES = [
  { name: "Mahamudu Bawumia",        party: "NPP", color: "#2563eb", bgColor: "rgba(37,99,235,0.1)"  },
  { name: "John Dramani Mahama",     party: "NDC", color: "#006B3F", bgColor: "rgba(0,107,63,0.1)"   },
  { name: "Ivor Kobina Greenstreet", party: "CPP", color: "#CE1126", bgColor: "rgba(206,17,38,0.1)"  },
  { name: "Nana Akosua Frimpomaa",   party: "PPP", color: "#7c3aed", bgColor: "rgba(124,58,237,0.1)" },
];

export const REGIONS = [
  "Greater Accra","Ashanti","Western","Central","Eastern",
  "Northern","Volta","Bono","Bono East","Ahafo",
  "Western North","Oti","Savannah","North East","Upper East","Upper West"
];

export const DISTRICTS_BY_REGION = {
  "Greater Accra": ["Accra Metropolitan","Tema Metropolitan","Ga East Municipal","Ga West Municipal","La Dade-Kotopon Municipal","La Nkwantanang-Madina Municipal","Adentan Municipal","Ashaiman Municipal","Kpone-Katamanso","Ningo-Prampram","Shai-Osudoku"],
  "Ashanti":       ["Kumasi Metropolitan","Oforikrom Municipal","Asokwa Municipal","Kwadaso Municipal","Suame Municipal","Tafo Municipal","Asante Akyem Central Municipal","Bekwai Municipal"],
  "Western":       ["Sekondi-Takoradi Metropolitan","Ahanta West Municipal","Nzema East Municipal","Ellembelle","Jomoro"],
  "Central":       ["Cape Coast Metropolitan","Komenda-Edina-Eguafo-Abrem Municipal","Mfantsiman Municipal","Asikuma-Odoben-Brakwa","Ajumako-Enyan-Essiam"],
  "Eastern":       ["Koforidua (New Juaben South) Municipal","Birim Central Municipal","Fanteakwa North","Kwahu West Municipal"],
  "Northern":      ["Tamale Metropolitan","Sagnarigu Municipal","Tolon","Kumbungu","Nanton"],
  "Volta":         ["Ho Municipal","Hohoe Municipal","Keta Municipal","Ketu South Municipal"],
  "Bono":          ["Sunyani Municipal","Dormaa Municipal","Berekum Municipal"],
  "Bono East":     ["Techiman Municipal","Kintampo North Municipal","Nkoranza South Municipal"],
  "Upper East":    ["Bolgatanga Municipal","Bawku Municipal","Navrongo (Kassena-Nankana Municipal)"],
  "Upper West":    ["Wa Municipal","Nadowli-Kaleo","Lawra Municipal"],
  "Ahafo":         ["Goaso Municipal","Asutifi North","Tano North Municipal"],
  "Western North": ["Sefwi Wiawso Municipal","Bibiani-Anhwiaso-Bekwai Municipal"],
  "Oti":           ["Dambai","Kadjebi","Buem (Jasikan)"],
  "Savannah":      ["Damongo","Sawla-Tuna-Kalba","East Gonja Municipal"],
  "North East":    ["Nalerigu-Gambaga (East Mamprusi Municipal)","Walewale (West Mamprusi Municipal)"],
};

export const CONSTITUENCIES_BY_DISTRICT = {
  "Accra Metropolitan":              ["Ablekuma Central","Ablekuma North","Ablekuma West","Ayawaso Central","Ayawaso East","Ayawaso North","Ayawaso West Wuogon","Okaikwei Central","Okaikwei North","Korle-Klottey"],
  "Tema Metropolitan":               ["Tema Central","Tema East","Tema West","Krowor","Ledzokuku"],
  "La Nkwantanang-Madina Municipal": ["Madina","Ayawaso East","Adentan"],
  "La Dade-Kotopon Municipal":       ["La Dadekotopon","Klottey Korle"],
  "Adentan Municipal":               ["Adentan"],
  "Ashaiman Municipal":              ["Ashaiman"],
  "Ga East Municipal":               ["Dome-Kwabenya","Trobu","Abokobi"],
  "Ga West Municipal":               ["Weija-Gbawe","Bortianor-Ngleshie Amanfrom"],
  "Kumasi Metropolitan":             ["Kumasi Central","Manhyia North","Manhyia South","Bantama","Suame","Tafo-Pankrono","Asokwa","Kwadaso","Oforikrom","Old Tafo","Nhyiaeso"],
  "Sekondi-Takoradi Metropolitan":   ["Sekondi","Effia","Takoradi","Kwesimintsim","Essikado-Ketan"],
  "Cape Coast Metropolitan":         ["Cape Coast North","Cape Coast South"],
  "Ho Municipal":                    ["Ho Central","Ho West"],
  "Tamale Metropolitan":             ["Tamale Central","Tamale North","Tamale South"],
  "Bolgatanga Municipal":            ["Bolgatanga Central","Bolgatanga East"],
  "Wa Municipal":                    ["Wa Central","Wa East","Wa West"],
};