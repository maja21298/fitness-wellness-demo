const MEAL_LABELS = {
  hr: { Breakfast: "Doručak", Lunch: "Ručak", Dinner: "Večera", Snack: "Snack" },
  it: { Breakfast: "Colazione", Lunch: "Pranzo", Dinner: "Cena", Snack: "Spuntino" },
  es: { Breakfast: "Desayuno", Lunch: "Almuerzo", Dinner: "Cena", Snack: "Merienda" },
  de: { Breakfast: "Frühstück", Lunch: "Mittagessen", Dinner: "Abendessen", Snack: "Snack" },
  fr: { Breakfast: "Petit-déjeuner", Lunch: "Déjeuner", Dinner: "Dîner", Snack: "Collation" },
  pt: { Breakfast: "Café da manhã", Lunch: "Almoço", Dinner: "Jantar", Snack: "Lanche" },
};

const hr = {
  "Oatmeal with Berries": {
    name: "Zobena kaša s bobičastim voćem",
    ingredients: ["zobene pahuljice", "mješavina bobičastog voća", "voda ili mlijeko", "med (po želji)"],
    steps: [
      "Zagrijte 250 ml vode ili mlijeka u malom loncu na srednje jakoj vatri dok ne proključa.",
      "Dodajte 80 g zobenih pahuljica, smanjite vatru na srednje nisku i miješajte povremeno 3-5 minuta dok ne postane kremasto.",
      "Prebacite u zdjelicu, dodajte šaku svježeg bobičastog voća (maline, borovnice, jagode) i po želji prelijte malo meda.",
    ],
  },
  "Greek Yogurt with Honey": {
    name: "Grčki jogurt s medom",
    ingredients: ["grčki jogurt", "med", "orasi (po želji)"],
    steps: [
      "Stavite 200 g grčkog jogurta u zdjelicu.",
      "Prelijte s jednom žlicom meda po cijeloj površini.",
      "Po želji pospite sitno nasjeckanim orasima za hrskavost i dodatne zdrave masnoće.",
    ],
  },
  "Chia Pudding with Kiwi": {
    name: "Chia puding s kivijem",
    ingredients: ["chia sjemenke", "bademovo mlijeko", "kiwi", "med"],
    steps: [
      "Pomiješajte chia sjemenke s bademovim mlijekom i ostavite 10 minuta ili preko noći da se zgusne.",
      "Ogulite i narežite kiwi na male kockice.",
      "Puding prelijte kivijem i po želji dodajte malo meda prije posluživanja.",
    ],
  },
  "Cottage Cheese Berry Bowl": {
    name: "Zdjelica s cottage sirom i bobičastim voćem",
    ingredients: ["cottage sir", "bobičasto voće", "lanene sjemenke"],
    steps: [
      "Stavite cottage sir u zdjelicu.",
      "Dodajte bobičasto voće i lanene sjemenke.",
      "Poslužite hladno kao brz proteinski doručak.",
    ],
  },
  "Spinach Mushroom Scramble": {
    name: "Kajgana sa špinatom i gljivama",
    ingredients: ["jaja", "špinat", "gljive", "maslinovo ulje", "sol", "papar"],
    steps: [
      "Narežite gljive i kratko ih prodinstajte na tavi.",
      "Dodajte špinat i pričekajte da uvene.",
      "Ulijte umućena jaja i miješajte dok se ne stegnu.",
    ],
  },
  "Breakfast Burrito": {
    name: "Doručak burrito",
    ingredients: ["tortilja", "jaja", "sir", "avokado", "salsa"],
    steps: [
      "Umutite jaja i ispecite ih na tavi dok se tek ne stisnu.",
      "Tortilju napunite jajima, sirom, avokadom i salsom.",
      "Zarolajte, kratko zapecite sa svake strane i poslužite.",
    ],
  },
  "French Toast with Banana": {
    name: "Francuski tost s bananom",
    ingredients: ["kruh", "jaja", "mlijeko", "banana", "javorov sirup"],
    steps: [
      "Umutite jaja i mlijeko u plitkoj zdjeli.",
      "Kruh umočite u smjesu i ispecite na tavi do zlatne boje.",
      "Na vrh dodajte narezanu bananu i malo javorovog sirupa.",
    ],
  },
  "Protein Overnight Oats": {
    name: "Proteinske zobene preko noći",
    ingredients: ["zobene pahuljice", "proteinski prah", "mlijeko", "maslac od kikirikija", "bobičasto voće"],
    steps: [
      "U staklenci pomiješajte zobene pahuljice, proteinski prah i mlijeko.",
      "Umiješajte maslac od kikirikija i ostavite preko noći u hladnjaku.",
      "Ujutro dodajte bobičasto voće i poslužite hladno.",
    ],
  },
  "Skyr Bowl with Fruit": {
    name: "Zdjelica sa skyr jogurtom i voćem",
    ingredients: ["skyr", "banana", "bobičasto voće", "granola"],
    steps: [
      "Stavite skyr u zdjelicu.",
      "Dodajte narezanu bananu, bobičasto voće i granolu.",
      "Poslužite odmah kao lagan proteinski doručak.",
    ],
  },
  "Egg and Avocado Sandwich": {
    name: "Sendvič s jajem i avokadom",
    ingredients: ["kruh od cjelovitih žitarica", "jaja", "avokado", "zelena salata"],
    steps: [
      "Skuhajte ili ispržite jaja po želji.",
      "Avokado zgnječite na kruh i dodajte listove salate.",
      "Na vrh složite jaja i zatvorite sendvič.",
    ],
  },
  "Banana Walnut Oats": {
    name: "Zobene pahuljice s bananom i orasima",
    ingredients: ["zobene pahuljice", "mlijeko", "banana", "orasi"],
    steps: [
      "Kuhajte zobene pahuljice u mlijeku dok ne postanu kremaste.",
      "Umiješajte narezanu bananu.",
      "Na vrh dodajte nasjeckane orahe i poslužite toplo.",
    ],
  },
  "Chicken Quinoa Salad": {
    name: "Salata s piletinom i kvinojom",
    ingredients: ["pileća prsa", "kvinoja", "zelena salata", "cherry rajčice", "limun"],
    steps: [
      "Skuhajte kvinoju i ostavite da se malo ohladi.",
      "Ispecite pileća prsa i narežite na trakice.",
      "Pomiješajte s povrćem i dovršite limunovim sokom.",
    ],
  },
  "Egg Tuna Lettuce Boats": {
    name: "Salatni listići s tunom i jajem",
    ingredients: ["tuna", "jaje", "romana salata", "senf"],
    steps: [
      "Pomiješajte tunu s nasjeckanim kuhanim jajetom i senfom.",
      "Smjesu rasporedite u listove romana salate.",
      "Poslužite odmah kao lagani proteinski ručak.",
    ],
  },
  "Turkey Veggie Bowl": {
    name: "Zdjelica s puretinom i povrćem",
    ingredients: ["mljevena puretina", "tikvica", "paprika", "smeđa riža", "paprika u prahu"],
    steps: [
      "Ispecite mljevenu puretinu s paprikom u prahu dok ne porumeni.",
      "Prodinstajte povrće dok ne omekša, ali ostane hrskavo.",
      "Poslužite preko male porcije smeđe riže.",
    ],
  },
  "Chicken Pesto Rice": {
    name: "Riža s piletinom i pestom",
    ingredients: ["pileća prsa", "riža", "pesto", "špinat"],
    steps: [
      "Skuhajte rižu i ostavite sa strane.",
      "Ispecite piletinu i narežite je.",
      "Umiješajte pesto u rižu, dodajte špinat i na vrh složite piletinu.",
    ],
  },
  "Beef Burrito Wrap": {
    name: "Burrito wrap s govedinom",
    ingredients: ["mljevena govedina", "tortilja", "riža", "grah", "sir"],
    steps: [
      "Ispecite govedinu sa začinima dok ne porumeni.",
      "Zagrijte tortilju i napunite je rižom, grahom, govedinom i sirom.",
      "Čvrsto zarolajte i kratko zapecite sa svake strane.",
    ],
  },
  "Creamy Chicken Pasta": {
    name: "Kremasta tjestenina s piletinom",
    ingredients: ["tjestenina", "piletina", "vrhnje za kuhanje", "parmezan", "grašak"],
    steps: [
      "Skuhajte tjesteninu al dente.",
      "Ispecite komadiće piletine dok ne postanu zlatni.",
      "Dodajte vrhnje i grašak, zatim umiješajte tjesteninu i parmezan.",
    ],
  },
  "Egg White Omelette with Spinach": {
    name: "Omlet od bjelanjaka sa špinatom",
    ingredients: ["4 bjelanjka", "šaka špinata", "sol", "papar", "sprej maslinovog ulja"],
    steps: [
      "Zagrijte tavu na srednju vatru i poprskajte uljem. Umutite 4 bjelanjka u zdjelici.",
      "Ulijte bjelanjke u tavu i kuhajte 1-2 minute dok rubovi ne počnu čvrsnuti.",
      "Dodajte šaku svježeg špinata na jednu polovicu, presavijte i kuhajte još 1-2 minute. Začinite solju i paprom.",
    ],
  },
  "Avocado Toast": {
    name: "Tost s avokadom",
    ingredients: ["kruh od cjelovitih žitarica", "pola avokada", "sok limuna", "sol", "ljute papričice"],
    steps: [
      "Prepecite kruh od cjelovitih žitarica do zlatne boje.",
      "Viljicom zgnječite pola avokada u zdjelici, dodajte malo soka limuna i prstohvat soli.",
      "Premažite zgnječeni avokado na tost, pospite ljutim papričicama i odmah poslužite.",
    ],
  },
  "Green Smoothie": {
    name: "Zeleni smoothie",
    ingredients: ["banana", "špinat", "proteinski prah", "bademovo mlijeko", "led"],
    steps: [
      "Stavite jednu bananu, šaku špinata i jednu žlicu proteinskog praha u blender.",
      "Dodajte 250 ml bademovog mlijeka i nekoliko kocki leda.",
      "Miksajte na visokoj brzini 30-60 sekundi dok ne bude potpuno glatko. Ulijte u čašu i uživajte.",
    ],
  },
  "Oatmeal with Banana & Peanut Butter": {
    name: "Zobena kaša s bananom i maslacem od kikirikija",
    ingredients: ["zobene pahuljice", "banana", "maslac od kikirikija", "mlijeko", "cimet"],
    steps: [
      "Kuhajte 80 g zobenih pahuljica u 250 ml mlijeka na srednje niskoj vatri 3-5 minuta uz miješanje.",
      "Narežite jednu bananu na kolutove i rasporedite po kaši.",
      "Dodajte punu žlicu maslaca od kikirikija i pospite cimetom. Promiješajte po želji.",
    ],
  },
  "Scrambled Eggs on Toast": {
    name: "Kajgana na tostu",
    ingredients: ["3 jaja", "maslac", "2 kriške kruha", "sol", "papar"],
    steps: [
      "Umutite 3 jaja u zdjelici sa solju i paprom. Otopite malo maslaca u tavi na srednje niskoj vatri.",
      "Ulijte jaja i polako miješajte drvenom žlicom dok ne postanu kremasto mekana.",
      "Prepecite 2 kriške kruha i poslužite kajganu na tostu. Dodajte papar po želji.",
    ],
  },
  "Protein Pancakes": {
    name: "Proteinske palačinke",
    ingredients: ["proteinski prah", "zobene pahuljice", "jaje", "banana", "javorov sirup"],
    steps: [
      "U blenderu pomiješajte 30 g proteinskog praha, 40 g zobenih pahuljica, 1 jaje i 1 bananu do glatke smjese.",
      "Zagrijte tavu na srednju vatru s malo ulja. Pecite palačinke po 2-3 minute sa svake strane do zlatne boje.",
      "Poslužite sa slojem javorovog sirupa i po želji svježim voćem.",
    ],
  },
  "Granola Bowl with Fruit": {
    name: "Zdjelica granole s voćem",
    ingredients: ["granola", "mlijeko", "banana", "bobičasto voće"],
    steps: [
      "Stavite 60 g granole u duboku zdjelicu.",
      "Prelijte sa 150 ml hladnog mlijeka.",
      "Narežite bananu na kolutove, dodajte svježe bobičasto voće i odmah jedite dok je granola hrskava.",
    ],
  },
  "Bagel with Cream Cheese & Salmon": {
    name: "Pecivo s kremastim sirom i lososom",
    ingredients: ["pecivo (bagel)", "kremasti sir", "dimljeni losos", "kapari"],
    steps: [
      "Prerežite pecivo na pola i lagano prepecite.",
      "Ravnomjerno premažite svaku polovicu kremastim sirom.",
      "Složite dimljeni losos preko sira, ukrasite kaparima i odmah poslužite.",
    ],
  },
  "Peanut Butter Toast": {
    name: "Tost s maslacem od kikirikija",
    ingredients: ["kruh od cjelovitih žitarica", "maslac od kikirikija", "kriške banane"],
    steps: [
      "Prepecite kruh od cjelovitih žitarica.",
      "Namažite debeli sloj maslaca od kikirikija.",
      "Rasporedite kriške banane po vrhu i poslužite.",
    ],
  },
  "Oatmeal with Milk & Banana": {
    name: "Zobena kaša s mlijekom i bananom",
    ingredients: ["zobene pahuljice", "mlijeko", "banana", "med"],
    steps: [
      "Kuhajte 80 g zobenih pahuljica u 250 ml mlijeka 3-5 minuta uz miješanje.",
      "Narežite bananu na kolutove i rasporedite po kaši.",
      "Prelijte žlicom meda i odmah jedite toplo.",
    ],
  },
  "Two Eggs with Whole-Wheat Toast": {
    name: "Dva jaja s tostom od cjelovitih žitarica",
    ingredients: ["2 jaja", "kruh od cjelovitih žitarica", "maslac", "sol"],
    steps: [
      "Pripremite jaja po želji — pržena ili kuhana. Začinite solju.",
      "Prepecite kruh od cjelovitih žitarica i lagano namažite maslacem.",
      "Poslužite jaja uz tost na tanjuru.",
    ],
  },
  "Yogurt Parfait with Granola": {
    name: "Parfait od jogurta s granolom",
    ingredients: ["jogurt", "granola", "mješavina bobičastog voća", "med"],
    steps: [
      "U čašu ili zdjelicu stavite sloj jogurta, zatim sloj granole, pa sloj bobičastog voća.",
      "Ponovite slojeve dok ne napunite posudu.",
      "Prelijte medom i odmah poslužite.",
    ],
  },
  "Fruit Smoothie with Oats": {
    name: "Voćni smoothie sa zobenim pahuljicama",
    ingredients: ["banana", "bobičasto voće", "zobene pahuljice", "mlijeko", "med"],
    steps: [
      "Stavite bananu, šaku bobičastog voća i 30 g zobenih pahuljica u blender.",
      "Dodajte 200 ml mlijeka i žlicu meda.",
      "Miksajte 30-60 sekundi do glatke smjese i odmah popijte.",
    ],
  },
  "Grilled Chicken Salad": {
    name: "Salata s piletinom s roštilja",
    ingredients: ["pileća prsa", "mješavina zelene salate", "rajčica", "krastavac", "maslinovo ulje", "limun"],
    steps: [
      "Začinite pileća prsa solju i paprom. Pecite na roštilju ili tavi 6-7 minuta sa svake strane dok ne budu potpuno kuhana.",
      "Narežite rajčicu na kriške i krastavac na kolutove. Rasporedite zelenu salatu na tanjur.",
      "Narežite piletinu na trake, složite na salatu. Prelijte maslinovim uljem i sokom limuna.",
    ],
  },
  "Turkey Wrap": {
    name: "Wrap s puretinom",
    ingredients: ["tortilja od cjelovitih žitarica", "naresci puretine", "zelena salata", "rajčica", "senf"],
    steps: [
      "Položite tortilju na ravnu površinu.",
      "Složite narezke puretine, listove zelene salate i kriške rajčice. Premažite senf po želji.",
      "Čvrsto zamotajte tortilju od jednog kraja do drugog i prerežite dijagonalno.",
    ],
  },
  "Tuna Salad": {
    name: "Salata s tunom",
    ingredients: ["konzerva tune", "mješavina zelene salate", "maslinovo ulje", "limun", "crveni luk"],
    steps: [
      "Ocijedite konzervu tune i rastresite viljicom u zdjelicu.",
      "Narežite crveni luk na tanke prstene i pomiješajte sa zelenom salatom.",
      "Dodajte tunu na vrh, prelijte maslinovim uljem i svježim sokom limuna.",
    ],
  },
  "Lentil Soup": {
    name: "Juha od leće",
    ingredients: ["leća", "mrkva", "celer", "luk", "češnjak", "povrtni temeljac"],
    steps: [
      "Nasjeckajte luk, mrkvu i celer na sitne kockice. Dinistajte na maslinovom ulju 3-4 minute.",
      "Dodajte 200 g leće, zgnječeni češnjak i 500 ml povrtnog temeljca. Posolite.",
      "Kuhajte na laganoj vatri 15-20 minuta dok leća ne omekša. Začinite po ukusu i poslužite toplo.",
    ],
  },
  "Grilled Fish with Broccoli": {
    name: "Riba s roštilja s brokulom",
    ingredients: ["bijeli riblji filet", "brokula", "maslinovo ulje", "limun", "češnjak"],
    steps: [
      "Začinite riblji filet sokom limuna, zgnječenim češnjakom, solju i paprom.",
      "Pecite na roštilju ili tavi 4 minute sa svake strane dok riba ne bude bijela i mekana.",
      "Prokuhajte brokulu na pari 3-4 minute dok ne bude al dente. Poslužite uz ribu s malo maslinovog ulja.",
    ],
  },
  "Chicken Rice Bowl": {
    name: "Zdjelica s piletinom i rižom",
    ingredients: ["pileća prsa", "riža", "mješavina povrća", "soja sos", "sezamovo ulje"],
    steps: [
      "Skuhajte rižu prema uputama na pakiranju. Ostavite poklopljenu dok se ne posuši.",
      "Pecite pileća prsa na tavi 6-7 min sa svake strane, narežite na trake.",
      "U zdjelicu stavite rižu, dodajte piletinu i povrće. Prelijte soja sosom i malo sezamovog ulja.",
    ],
  },
  "Steak with Mashed Potatoes": {
    name: "Odrezak s pireom od krumpira",
    ingredients: ["goveđi odrezak", "krumpir", "maslac", "mlijeko", "sol", "papar"],
    steps: [
      "Ogulite i narežite 400 g krumpira. Kuhajte u posoljenoj vodi 15-20 minuta dok ne omekšaju.",
      "Ocijedite i izgnječite s maslacem i malo mlijeka do kremaste teksture. Začinite solju i paprom.",
      "Odrezak začinite i pecite na jakoj vatri 3-4 min sa svake strane (za medium). Ostavite 5 min prije rezanja.",
    ],
  },
  "Pasta with Meat Sauce": {
    name: "Tjestenina s mesnim umakom",
    ingredients: ["tjestenina", "mljevena govedina", "umak od rajčice", "luk", "češnjak", "parmezan"],
    steps: [
      "Skuhajte tjesteninu al dente prema uputama. Ocijedite i sačuvajte malo vode od kuhanja.",
      "Na maslinovom ulju propržite nasjeckan luk i češnjak 2 min, dodajte 200 g mljevene govedine i pržite dok ne porumeni.",
      "Umiješajte umak od rajčice, kuhajte 10 minuta na laganoj vatri. Dodajte tjesteninu i pospite parmezanom.",
    ],
  },
  "Salmon Quinoa Bowl": {
    name: "Zdjelica s lososom i kvinojom",
    ingredients: ["filet lososa", "kvinoja", "avokado", "krastavac", "soja sos"],
    steps: [
      "Isperite kvinoju i kuhajte u dvostrukoj količini vode 15 minuta dok ne upije svu tekućinu.",
      "Pecite filet lososa u tavi kožom prema dolje 4 min, okrenite i kuhajte još 3 minute.",
      "Složite kvinoju u zdjelicu, dodajte narezani avokado, krastavac i lososa. Pokapajte soja sosom.",
    ],
  },
  "Burrito Bowl": {
    name: "Burrito zdjelica",
    ingredients: ["riža", "crni grah", "piletina", "sir", "salsa", "kiselo vrhnje"],
    steps: [
      "Skuhajte rižu i ocijedite konzervu crnog graha, zagrijte grah u loncu.",
      "Pecite piletinu na roštilju ili tavi, narežite na kocke.",
      "Složite u zdjelicu: riža, grah, piletina, naribani sir, salsa i žlica kiselog vrhnja.",
    ],
  },
  "Chicken with Brown Rice": {
    name: "Piletina sa smeđom rižom",
    ingredients: ["pileća prsa", "smeđa riža", "mješavina povrća", "maslinovo ulje"],
    steps: [
      "Skuhajte smeđu rižu prema uputama (obično 20-25 min). Ostavite poklopljenu 5 min.",
      "Začinite pileća prsa i pecite na tavi 6-7 min sa svake strane do zlatne boje.",
      "Na malo maslinovog ulja prodinstajte povrće 3-4 min. Poslužite piletinu uz rižu i povrće.",
    ],
  },
  "Salmon with Vegetables": {
    name: "Losos s povrćem",
    ingredients: ["filet lososa", "mješavina povrća", "maslinovo ulje", "limun", "začinsko bilje"],
    steps: [
      "Zagrijte pećnicu na 200°C. Začinite lososa začinskim biljem, solju, paprom i sokom limuna.",
      "Pecite lososa 12-15 minuta dok ne bude lako razdjeljiv vilicom.",
      "Povrće poprskajte maslinovim uljem i pecite uz lososa. Poslužite zajedno.",
    ],
  },
  "Chicken Wrap": {
    name: "Wrap s piletinom",
    ingredients: ["tortilja", "pečena piletina", "zelena salata", "rajčica", "umak od jogurta"],
    steps: [
      "Narežite pečenu piletinu na tanje trake.",
      "Na tortilju složite piletinu, listove salate i kriške rajčice.",
      "Dodajte žlicu umaka od jogurta, zamotajte čvrsto i poslužite.",
    ],
  },
  "Tofu Noodle Stir-Fry": {
    name: "Prženi rezanci s tofuom",
    ingredients: ["tofu", "rezanci", "paprika", "brokula", "soja sos", "đumbir"],
    steps: [
      "Ocijedite tofu i narežite na kocke. Skuhajte rezance prema uputama.",
      "Na vrućem ulju pržite tofu 3-4 min dok ne porumeni. Izvadite na stranu.",
      "Na istoj tavi prodinstajte narezanu papriku i brokulu 3 min. Dodajte rezance, tofu, soja sos i ribani đumbir. Miješajte 2 min.",
    ],
  },
  "Quinoa Chicken Bowl": {
    name: "Zdjelica s kvinojom i piletinom",
    ingredients: ["kvinoja", "pileća prsa", "slanutak", "krastavac", "tahini"],
    steps: [
      "Skuhajte kvinoju 15 minuta, ocijedite slanutak iz konzerve.",
      "Pecite pileća prsa na tavi ili roštilju 6-7 min sa svake strane, narežite na trake.",
      "U zdjelicu složite kvinoju, piletinu, slanutak i narezani krastavac. Prelijte tahini umakom.",
    ],
  },
  "Baked Salmon with Asparagus": {
    name: "Pečeni losos sa šparogama",
    ingredients: ["filet lososa", "šparoge", "maslinovo ulje", "limun", "češnjak"],
    steps: [
      "Zagrijte pećnicu na 200°C. Položite lososa i šparoge na lim za pečenje.",
      "Poprskajte maslinovim uljem, dodajte tanke kriške češnjaka i sok limuna.",
      "Pecite 15 minuta dok losos ne bude ružičast i lako razdjeljiv, a šparoge nježne.",
    ],
  },
  "Chicken Stir-Fry": {
    name: "Pržena piletina s povrćem",
    ingredients: ["pileća prsa", "paprike", "brokula", "soja sos", "đumbir"],
    steps: [
      "Narežite piletinu na tanke trake, a povrće na komadiće.",
      "Pržite piletinu na jakoj vatri 4-5 minuta dok ne porumeni i bude kuhana.",
      "Dodajte povrće, soja sos i ribani đumbir. Miješajte na jakoj vatri još 3-4 minute dok povrće ne bude al dente.",
    ],
  },
  "Grilled Fish with Salad": {
    name: "Riba s roštilja sa salatom",
    ingredients: ["bijela riba", "mješavina zelene salate", "cherry rajčice", "maslinovo ulje", "balzamični ocat"],
    steps: [
      "Začinite riblji filet solju i paprom. Pecite na roštilju ili tavi 3-4 min sa svake strane.",
      "U zdjelici pomiješajte zelenu salatu s prerezanim cherry rajčicama.",
      "Prelijte salatu maslinovim uljem i balzamičnim octom. Poslužite uz ribu.",
    ],
  },
  "Turkey Meatballs with Zucchini": {
    name: "Ćufte od puretine s tikvicama",
    ingredients: ["mljevena puretina", "tikvice", "jaje", "krušne mrvice", "umak od rajčice"],
    steps: [
      "Pomiješajte 300 g mljevene puretine s 1 jajetom i 2 žlice krušnih mrvica. Oblikujte male ćufte.",
      "Pecite u pećnici na 200°C 20 minuta ili dok ne porumene. Okrećite na pola vremena.",
      "Tikvice narežite na rezance ili spirale. Zagrijte umak od rajčice i poslužite ćufte s tikvicama i umakom.",
    ],
  },
  "Shrimp with Vegetables": {
    name: "Škampi s povrćem",
    ingredients: ["škampi", "mješavina povrća", "češnjak", "maslinovo ulje", "limun"],
    steps: [
      "Zagrijte maslinovo ulje u tavi, dodajte nasjeckan češnjak i pržite 30 sekundi.",
      "Dodajte škampe i pržite 2-3 minute sa svake strane dok ne porumene.",
      "Dodajte povrće, posolite, pokapajte limunskim sokom i kuhajte još 3-4 minute.",
    ],
  },
  "Steak with Sweet Potato": {
    name: "Odrezak s batatom",
    ingredients: ["goveđi odrezak", "batat", "maslac", "ružmarin", "sol"],
    steps: [
      "Zagrijte pećnicu na 200°C. Narežite batat na kolutove, poprskajte uljem i pecite 25-30 minuta.",
      "Začinite odrezak solju i paprom. Pecite na jakoj vatri 3-4 min sa svake strane za medium rare.",
      "Ostavite odrezak da odstoji 5 min. Poslužite s batatom i grančicom svježeg ružmarina.",
    ],
  },
  "Chicken Thighs with Rice": {
    name: "Pileći bataci s rižom",
    ingredients: ["pileći bataci", "riža", "luk", "češnjak", "pileći temeljac"],
    steps: [
      "Začinite pileće batake i pržite u tavi kožom dolje 5-6 min dok koža ne bude hrskava.",
      "Okrenite, dodajte nasjeckani luk i češnjak, kuhajte još 2 min.",
      "Rižu kuhajte u pilećem temeljcu 15 min. Poslužite batake na riži s umakom iz tave.",
    ],
  },
  "Pesto Chicken Pasta": {
    name: "Tjestenina s piletinom i pestom",
    ingredients: ["tjestenina", "pileća prsa", "pesto", "parmezan", "cherry rajčice"],
    steps: [
      "Skuhajte tjesteninu al dente prema uputama na pakiranju. Ocijedite.",
      "Pecite pileća prsa 6-7 min sa svake strane, narežite na trake.",
      "Pomiješajte tjesteninu s pestom, dodajte piletinu i prerezane cherry rajčice. Pospite parmezanom.",
    ],
  },
  "Salmon with Mashed Potatoes": {
    name: "Losos s pireom od krumpira",
    ingredients: ["losos", "krumpir", "maslac", "mlijeko", "kopar"],
    steps: [
      "Pecite lososa u pećnici na 200°C 12-15 minuta dok ne bude lako razdjeljiv.",
      "Ogulite krumpir, skuhajte do mekoće i izgnječite s maslacem i mlijekom.",
      "Poslužite lososa na pireu i ukrasite koprom.",
    ],
  },
  "Chicken with Roasted Vegetables": {
    name: "Piletina s pečenim povrćem",
    ingredients: ["pileća prsa", "paprika", "tikvica", "luk", "maslinovo ulje"],
    steps: [
      "Zagrijte pećnicu na 200°C i narežite povrće na veće komade.",
      "Poprskajte povrće uljem, posolite i pecite 20-25 minuta.",
      "Pecite pileća prsa na tavi 6-7 minuta sa svake strane i poslužite uz povrće.",
    ],
  },
  "Baked Fish with Quinoa": {
    name: "Pečena riba s kvinojom",
    ingredients: ["bijela riba", "kvinoja", "limun", "začinsko bilje", "zeleno povrće"],
    steps: [
      "Skuhajte kvinoju prema uputama na pakiranju.",
      "Začinite ribu i pecite je u pećnici 12-15 minuta.",
      "Poslužite uz kvinoju i kuhano zeleno povrće.",
    ],
  },
  "Turkey Burger with Sweet Potato Fries": {
    name: "Pureći burger s pomfritom od batata",
    ingredients: ["mljevena puretina", "pecivo od cjelovitih žitarica", "batat", "zelena salata", "rajčica"],
    steps: [
      "Narežite batat na štapiće, poprskajte uljem i pecite 20-25 minuta.",
      "Oblikujte pljeskavice od puretine i ispecite ih na tavi.",
      "Složite burger i poslužite uz batat.",
    ],
  },
  "Tofu Stir-Fry with Brown Rice": {
    name: "Prženi tofu sa smeđom rižom",
    ingredients: ["tofu", "smeđa riža", "povrće", "soja sos", "sezamovo ulje"],
    steps: [
      "Skuhajte smeđu rižu i ocijedite tofu.",
      "Pržite tofu na sezamovom ulju dok ne porumeni.",
      "Dodajte povrće i soja sos, pa poslužite preko riže.",
    ],
  },
  "Chicken with Steamed Broccoli": {
    name: "Piletina s brokulom na pari",
    ingredients: ["pileća prsa", "brokula", "maslinovo ulje", "češnjak", "limun"],
    steps: [
      "Začinite piletinu i ispecite je na tavi 6-7 minuta sa svake strane.",
      "Brokulu skuhajte na pari 3-4 minute dok ne omekša.",
      "Pokapajte limunom i maslinovim uljem te poslužite zajedno.",
    ],
  },
  "Greek Yogurt": {
    name: "Grčki jogurt",
    ingredients: ["grčki jogurt"],
    steps: ["Poslužite hladno. Po želji dodajte cimet ili malo voća."],
  },
  "Apple Slices": {
    name: "Kriške jabuke",
    ingredients: ["1 jabuka"],
    steps: ["Operite jabuku, narežite na kriške i poslužite."],
  },
  "Carrot Sticks with Hummus": {
    name: "Štapići mrkve s humusom",
    ingredients: ["mrkva", "humus"],
    steps: ["Ogulite mrkvu, narežite na štapiće i poslužite s humusom."],
  },
  "Green Tea": {
    name: "Zeleni čaj",
    ingredients: ["vrećica zelenog čaja", "vruća voda"],
    steps: ["Prelijte vrućom vodom, ostavite 3 minute i popijte toplo."],
  },
  "Cottage Cheese": {
    name: "Svježi sir",
    ingredients: ["svježi sir"],
    steps: ["Poslužite ohlađeno. Po želji začinite paprom ili začinskim biljem."],
  },
  "Protein Shake with Banana": {
    name: "Proteinski shake s bananom",
    ingredients: ["proteinski prah", "banana", "mlijeko", "maslac od kikirikija"],
    steps: ["Stavite sve sastojke u blender, izmiksajte i odmah popijte."],
  },
  "Trail Mix": {
    name: "Mješavina orašastih plodova i suhog voća",
    ingredients: ["mješavina orašastih plodova", "suho voće", "komadići tamne čokolade"],
    steps: ["Pomiješajte sastojke i uzmite jednu šaku kao užinu."],
  },
  "Apple Yogurt Cup": {
    name: "Jogurt šalica s jabukom",
    ingredients: ["jogurt", "jabuka", "cimet"],
    steps: [
      "Stavite jogurt u šalicu ili malu zdjelicu.",
      "Dodajte narezanu jabuku i pospite cimetom.",
      "Poslužite hladno kao laganu užinu.",
    ],
  },
  "Boiled Egg Snack Plate": {
    name: "Snack tanjur s kuhanim jajetom",
    ingredients: ["kuhana jaja", "sol", "papar"],
    steps: [
      "Ogulite kuhana jaja i rasporedite ih na tanjur.",
      "Posolite i popaprite po želji.",
      "Poslužite odmah kao brz proteinski snack.",
    ],
  },
  "Mini Protein Smoothie": {
    name: "Mali proteinski smoothie",
    ingredients: ["proteinski prah", "bobičasto voće", "mlijeko"],
    steps: [
      "Stavite sastojke u blender.",
      "Miksajte dok smjesa ne postane glatka.",
      "Ulijte u malu čašu i odmah popijte.",
    ],
  },
  "Trail Mix Yogurt Pot": {
    name: "Jogurt s trail mixom",
    ingredients: ["jogurt", "trail mix", "med"],
    steps: [
      "Stavite jogurt u malu posudu.",
      "Dodajte trail mix i po želji malo meda.",
      "Poslužite odmah kao zasitan snack.",
    ],
  },
  "Banana Peanut Oat Cup": {
    name: "Zobena šalica s bananom i kikirikijem",
    ingredients: ["banana", "zobene pahuljice", "maslac od kikirikija", "mlijeko"],
    steps: [
      "Lagano zgnječi bananu.",
      "Pomiješaj je sa zobenim pahuljicama, maslacem od kikirikija i malo mlijeka.",
      "Posluži kao brzi, zasitni međuobrok.",
    ],
  },
  "Ham Cheese Toastie": {
    name: "Tost sa šunkom i sirom",
    ingredients: ["kruh", "šunka", "sir", "maslac"],
    steps: [
      "Napunite kruh šunkom i sirom.",
      "Lagano premažite vanjsku stranu maslacem.",
      "Pecite u tavi ili tosteru dok ne postane zlatno i hrskavo.",
    ],
  },
  "Banana Almond Yogurt": {
    name: "Jogurt s bananom i bademima",
    ingredients: ["jogurt", "banana", "bademi"],
    steps: [
      "Stavite jogurt u zdjelicu.",
      "Dodajte narezanu bananu i nasjeckane bademe.",
      "Poslužite hladno.",
    ],
  },
  "Cottage Cheese Crackers": {
    name: "Krekeri sa svježim sirom",
    ingredients: ["krekeri", "svježi sir", "krastavac"],
    steps: [
      "Premažite krekere svježim sirom.",
      "Po vrhu dodajte tanke kriške krastavca.",
      "Poslužite kao laganu, proteinsku užinu.",
    ],
  },
  "Protein Cocoa Mug": {
    name: "Proteinska kakao šalica",
    ingredients: ["mlijeko", "kakao", "proteinski prah", "med"],
    steps: [
      "Lagano zagrijte mlijeko u šalici ili lončiću.",
      "Umiješajte kakao i proteinski prah dok ne postane glatko.",
      "Dodajte malo meda i poslužite toplo.",
    ],
  },
  "Apple Cinnamon Skyr Cup": {
    name: "Skyr s jabukom i cimetom",
    ingredients: ["skyr", "jabuka", "cimet", "med"],
    steps: [
      "Stavite skyr u čašu ili zdjelicu.",
      "Dodajte narezanu jabuku i pospite cimetom.",
      "Po želji lagano prelijte medom i poslužite hladno.",
    ],
  },
  "Protein Berry Smoothie": {
    name: "Proteinski smoothie s bobičastim voćem",
    ingredients: ["proteinski prah", "bobičasto voće", "mlijeko", "led"],
    steps: [
      "Stavite sve sastojke u blender.",
      "Miksajte dok ne postane glatko i kremasto.",
      "Ulijte u čašu i odmah popijte.",
    ],
  },
  "Tomato Egg Toast": {
    name: "Tost s rajčicom i jajem",
    ingredients: ["kruh", "jaje", "rajčica", "sol", "papar"],
    steps: [
      "Prepecite kruh do zlatne boje.",
      "Ispecite jaje po želji i narežite rajčicu na kriške.",
      "Složite na tost, začinite i poslužite odmah.",
    ],
  },
  "Peanut Butter Banana Bagel": {
    name: "Bagel s maslacem od kikirikija i bananom",
    ingredients: ["bagel", "maslac od kikirikija", "banana"],
    steps: [
      "Prerežite bagel i lagano ga prepecite.",
      "Namažite maslac od kikirikija po obje polovice.",
      "Dodajte narezanu bananu i poslužite.",
    ],
  },
  "Granola Yogurt Power Bowl": {
    name: "Proteinska zdjelica jogurta i granole",
    ingredients: ["jogurt", "granola", "banana", "med"],
    steps: [
      "Stavite jogurt u zdjelicu.",
      "Dodajte granolu i narezanu bananu.",
      "Prelijte s malo meda i poslužite odmah.",
    ],
  },
  "Ham Cheese Omelette Plate": {
    name: "Tanjur s omletom, šunkom i sirom",
    ingredients: ["jaja", "šunka", "sir", "maslac", "sol"],
    steps: [
      "Umutite jaja sa soli i ispecite omlet na malo maslaca.",
      "Dodajte šunku i sir, pa savijte omlet.",
      "Poslužite na tanjuru dok je još topao.",
    ],
  },
  "Berry Toast with Ricotta": {
    name: "Tost s ricottom i bobičastim voćem",
    ingredients: ["kruh", "ricotta", "bobičasto voće", "med"],
    steps: [
      "Prepecite kruh do lagano hrskave teksture.",
      "Premažite ricottom i dodajte bobičasto voće.",
      "Po želji dodajte malo meda i poslužite.",
    ],
  },
  "Mango Yogurt Oats": {
    name: "Zobena kaša s jogurtom i mangom",
    ingredients: ["zobene pahuljice", "jogurt", "mango", "chia sjemenke"],
    steps: [
      "Pomiješajte zobene pahuljice i jogurt u zdjelici.",
      "Dodajte narezani mango na vrh.",
      "Pospite chia sjemenkama i poslužite hladno.",
    ],
  },
  "Turkey Breakfast Wrap": {
    name: "Doručak wrap s puretinom",
    ingredients: ["tortilja", "jaja", "puretina", "špinat"],
    steps: [
      "Umutite i ispecite jaja na tavi.",
      "Napunite tortilju jajima, puretinom i špinatom.",
      "Zarolajte i kratko zagrijte prije posluživanja.",
    ],
  },
  "Salmon Spinach Plate": {
    name: "Tanjur s lososom i špinatom",
    ingredients: ["losos", "špinat", "krumpir", "limun"],
    steps: [
      "Pecite ili ispecite lososa dok ne bude gotov.",
      "Kratko uvenite špinat na tavi ili na pari.",
      "Poslužite zajedno s krumpirom i malo limuna.",
    ],
  },
  "Chicken Soup Bowl": {
    name: "Zdjelica pileće juhe",
    ingredients: ["piletina", "mrkva", "celer", "temeljac"],
    steps: [
      "Skuhajte piletinu u temeljcu dok ne omekša.",
      "Dodajte mrkvu i celer te kuhajte do mekanoće.",
      "Poslužite toplo u zdjelici.",
    ],
  },
  "Cottage Cheese Veggie Toast": {
    name: "Tost sa svježim sirom i povrćem",
    ingredients: ["kruh", "svježi sir", "krastavac", "rajčica"],
    steps: [
      "Prepecite kruh do zlatne boje.",
      "Premažite svježim sirom i dodajte povrće.",
      "Poslužite odmah kao lagan obrok.",
    ],
  },
  "Turkey Potato Power Bowl": {
    name: "Proteinska zdjelica s puretinom i krumpirom",
    ingredients: ["mljevena puretina", "krumpir", "kukuruz", "jogurt umak"],
    steps: [
      "Skuhajte ili ispecite krumpir dok ne omekša.",
      "Pecite puretinu na tavi dok ne porumeni.",
      "Složite u zdjelicu i dodajte kukuruz i jogurt umak.",
    ],
  },
  "Salmon Avocado Wrap": {
    name: "Wrap s lososom i avokadom",
    ingredients: ["wrap", "losos", "avokado", "zelena salata", "jogurt umak"],
    steps: [
      "Stavite lososa i avokado na wrap.",
      "Dodajte zelenu salatu i malo jogurt umaka.",
      "Čvrsto zarolajte i prerežite napola.",
    ],
  },
  "Chicken Couscous Tray": {
    name: "Tanjur s piletinom i kuskusom",
    ingredients: ["piletina", "kuskus", "pečeno povrće", "maslinovo ulje"],
    steps: [
      "Pripremite kuskus prema uputama na pakiranju.",
      "Ispecite piletinu i povrće dok ne omekšaju.",
      "Posložite na tanjur i pokapajte maslinovim uljem.",
    ],
  },
  "Lamb Chops with Couscous": {
    name: "Janjeći kotleti s kuskusom",
    ingredients: ["janjeći kotleti", "kuskus", "menta", "limun", "maslinovo ulje"],
    steps: [
      "Začinite janjeće kotlete solju, paprom i maslinovim uljem. Pecite na jakoj vatri 3-4 min sa svake strane.",
      "Pripremite kuskus tako da ga prelijete vrućom vodom, poklopite 5 min i rastresite vilicom.",
      "Umiješajte u kuskus sitno nasjeckanu mentu i sok limuna. Poslužite uz kotlete.",
    ],
  },
  "Mediterranean Chicken Couscous": {
    name: "Mediteranski kuskus s piletinom",
    ingredients: ["pileća prsa", "kuskus", "krastavac", "rajčica", "maslinovo ulje"],
    steps: [
      "Pripremite kuskus prema uputama na pakiranju.",
      "Ispecite piletinu i narežite je na trakice.",
      "Pomiješajte s povrćem i prelijte maslinovim uljem.",
    ],
  },
  "Tofu Peanut Rice Bowl": {
    name: "Rižina zdjela s tofuom i kikirikijem",
    ingredients: ["tofu", "riža", "brokula", "maslac od kikirikija", "soja sos"],
    steps: [
      "Skuhajte rižu i ostavite sa strane.",
      "Ispecite tofu dok ne dobije zlatnu koricu.",
      "Dodajte brokulu i brz umak od maslaca od kikirikija i soja sosa, pa poslužite preko riže.",
    ],
  },
  "Turkey Pasta Salad": {
    name: "Salata s tjesteninom i puretinom",
    ingredients: ["tjestenina", "puretina", "kukuruz", "rajčica", "dressing od jogurta"],
    steps: [
      "Skuhajte tjesteninu i ostavite da se malo ohladi.",
      "Pomiješajte je s puretinom, kukuruzom i rajčicom.",
      "Prelijte laganim jogurt dressingom i poslužite.",
    ],
  },
  "Cod with Green Beans": {
    name: "Bakalar sa zelenim mahunama",
    ingredients: ["bakalar", "zelene mahune", "češnjak", "maslinovo ulje"],
    steps: [
      "Začinite bakalar i pecite ga ili kratko zapecite na tavi.",
      "Zelene mahune skuhajte na pari ili kratko prodinstajte.",
      "Dovršite s malo maslinovog ulja i češnjaka.",
    ],
  },
  "Turkey Zucchini Skillet": {
    name: "Tava s puretinom i tikvicama",
    ingredients: ["mljevena puretina", "tikvica", "passata", "luk"],
    steps: [
      "Prodinstajte luk pa dodajte mljevenu puretinu i ispecite je do smeđe boje.",
      "Umiješajte tikvicu i kratko je omekšajte.",
      "Ulijte passatu i kuhajte još par minuta prije posluživanja.",
    ],
  },
  "Tofu Veggie Soup": {
    name: "Juha od tofua i povrća",
    ingredients: ["tofu", "povrtni temeljac", "bok choy", "mrkva", "đumbir"],
    steps: [
      "Zakuhajte temeljac s đumbirom i mrkvom.",
      "Dodajte tofu i bok choy.",
      "Kuhajte dok povrće ne omekša i poslužite toplo.",
    ],
  },
  "Beef Rice Stir-Fry": {
    name: "Pržena riža s govedinom",
    ingredients: ["goveđe trakice", "riža", "miješano povrće", "soja sos"],
    steps: [
      "Skuhajte rižu i ostavite sa strane.",
      "Ispecite govedinu dok ne porumeni.",
      "Dodajte povrće i rižu, pa sve promiješajte sa soja sosom.",
    ],
  },
  "Chicken Alfredo Bake": {
    name: "Zapečena Alfredo piletina s tjesteninom",
    ingredients: ["piletina", "tjestenina", "Alfredo umak", "mozzarella"],
    steps: [
      "Skuhajte tjesteninu malo kraće od al dente.",
      "Ispecite komadiće piletine i pomiješajte ih s tjesteninom i umakom.",
      "Pospite mozzarellom i zapecite dok ne postane zlatno.",
    ],
  },
  "Salmon Rice Plate": {
    name: "Tanjur s lososom i rižom",
    ingredients: ["losos", "riža", "avokado", "krastavac"],
    steps: [
      "Skuhajte rižu dok ne postane rahla.",
      "Ispecite ili zapecite lososa dok ne bude gotov.",
      "Poslužite uz avokado i krastavac.",
    ],
  },
  "Chicken Couscous Plate": {
    name: "Tanjur s piletinom i kuskusom",
    ingredients: ["pileća prsa", "kuskus", "pečeno povrće"],
    steps: [
      "Pripremite kuskus i ispecite povrće.",
      "Pecite ili ispecite pileća prsa na tavi.",
      "Poslužite sve zajedno na tanjuru.",
    ],
  },
  "Shrimp Rice Bowl": {
    name: "Rižina zdjela sa škampima",
    ingredients: ["škampi", "riža", "grašak", "limun"],
    steps: [
      "Skuhajte rižu i držite je toplom.",
      "Škampe kratko prodinstajte dok ne postanu ružičasti.",
      "Dodajte grašak i limun pa poslužite preko riže.",
    ],
  },
  "Tofu Sesame Noodles": {
    name: "Rezanci s tofuom i sezamom",
    ingredients: ["tofu", "rezanci", "sezamovo ulje", "mrkva", "soja sos"],
    steps: [
      "Skuhajte rezance i ocijedite ih.",
      "Ispecite tofu u sezamovom ulju dok ne porumeni.",
      "Dodajte mrkvu i soja sos, pa sve promiješajte s rezancima.",
    ],
  },
  "Rice Cakes with Cottage Cheese": {
    name: "Rižini krekeri s cottage sirom",
    ingredients: ["rižini krekeri", "cottage sir"],
    steps: [
      "Premažite cottage sir preko rižinih krekera.",
      "Poslužite odmah kao laganu užinu.",
    ],
  },
  "Berry Protein Pudding": {
    name: "Proteinski puding s bobičastim voćem",
    ingredients: ["proteinski puding", "bobičasto voće"],
    steps: [
      "Stavite proteinski puding u zdjelicu.",
      "Na vrh dodajte bobičasto voće i poslužite hladno.",
    ],
  },
  "Date Nut Energy Bites": {
    name: "Energetske kuglice s datuljama i orašastim plodovima",
    ingredients: ["datulje", "orašasti plodovi", "zobene pahuljice", "kakao"],
    steps: [
      "Izmiksajte datulje, orašaste plodove, zobene pahuljice i kakao u ljepljivu smjesu.",
      "Oblikujte male kuglice.",
      "Kratko ih ohladite prije posluživanja.",
    ],
  },
  "Peanut Butter Smoothie": {
    name: "Smoothie s maslacem od kikirikija",
    ingredients: ["mlijeko", "banana", "maslac od kikirikija", "proteinski prah"],
    steps: [
      "Stavite sve sastojke u blender.",
      "Miksajte dok ne postane potpuno glatko.",
      "Ulijte u čašu i odmah popijte.",
    ],
  },
  "Peanut Butter on Toast": {
    name: "Tost s maslacem od kikirikija",
    ingredients: ["kruh", "maslac od kikirikija"],
    steps: [
      "Prepecite kruh do zlatne boje.",
      "Namažite debeli sloj maslaca od kikirikija i odmah jedite.",
    ],
  },
  "Almonds (30g)": {
    name: "Bademi (30 g)",
    ingredients: ["bademi"],
    steps: ["Izvagajte 30 g badema (otprilike 23 komada). Jedite kao brzu i hranjvu užinu."],
  },
  "Banana with Peanut Butter": {
    name: "Banana s maslacem od kikirikija",
    ingredients: ["banana", "maslac od kikirikija"],
    steps: [
      "Ogulite i narežite bananu na kolutove.",
      "Dodajte žlicu maslaca od kikirikija za umakanje ili ga premažite po kolutovima.",
    ],
  },
  "Apple with Peanut Butter": {
    name: "Jabuka s maslacem od kikirikija",
    ingredients: ["jabuka", "maslac od kikirikija"],
    steps: [
      "Operite jabuku i narežite na kriške.",
      "Poslužite uz žlicu maslaca od kikirikija za umakanje.",
    ],
  },
  "Mixed Nuts (25g)": {
    name: "Mješavina orašastih plodova (25 g)",
    ingredients: ["mješavina orašastih plodova"],
    steps: ["Izvagajte 25 g mješavine orašastih plodova kao hranjvu užinu bogatu zdravim masnoćama."],
  },
  "Protein Bar": {
    name: "Proteinska pločica",
    ingredients: ["proteinska pločica"],
    steps: ["Raspakujte i pojedite kao praktičnu užinu nakon treninga ili između obroka."],
  },
  "Yogurt with Berries": {
    name: "Jogurt s bobičastim voćem",
    ingredients: ["jogurt", "mješavina bobičastog voća"],
    steps: [
      "Stavite 150 g jogurta u zdjelicu.",
      "Dodajte šaku svježeg bobičastog voća (maline, borovnice, jagode) i odmah jedite.",
    ],
  },
  "Hard-Boiled Egg": {
    name: "Tvrdo kuhano jaje",
    ingredients: ["1 jaje"],
    steps: [
      "Stavite jaje u lonac s hladnom vodom. Dovedite do vrenja i kuhajte točno 10 minuta.",
      "Prebacite u hladnu vodu, ohladite, ogulite i jedite.",
    ],
  },
};

const MOJIBAKE_TO_ASCII = [
  // Common mojibake for HR/DE/FR/PT diacritics (keep output consistent with app-wide ASCII style)
  ["Ĺˇ", "s"],
  ["Ĺľ", "z"],
  ["ÄŤ", "c"],
  ["Ä‡", "c"],
  ["Ä‘", "d"],
  ["Ĺ ", "S"],
  ["Ĺ˝", "Z"],
  ["ÄŒ", "C"],
  ["Ä†", "C"],
  ["Ä�", "D"],
  ["ĂĽ", "u"],
  ["Ăœ", "U"],
  ["Ă©", "e"],
  ["Ă¨", "e"],
  ["Ăª", "e"],
  ["Ă®", "i"],
  ["Ă¯", "i"],
  ["Ăł", "o"],
  ["Ă¶", "o"],
  ["Ă´", "o"],
  ["Ăą", "u"],
  ["Ăş", "u"],
  ["Ă§", "c"],
  ["Ă±", "n"],
  ["ĂŁ", "a"],
  ["Ă ", "a"],
  ["ÄŤ", "c"],
  ["Ä‡", "c"],
  ["Ä‘", "d"],
  ["Ĺˇ", "s"],
  ["Ĺľ", "z"],
  ["ÄŚ", "C"],
  ["Ä†", "C"],
  ["ÄĐ", "D"],
  ["Ĺ ", "S"],
  ["Ĺ˝", "Z"],
  ["Ă©", "e"],
  ["Ă¨", "e"],
  ["Ă¶", "o"],
  ["Ă¼", "u"],
  ["Ă", ""],
  ["Â", ""],
  ["â€”", "-"],
  ["â€“", "-"],
  ["â€ś", "\""],
  ["â€ť", "\""],
  ["â€ž", "\""],
  ["â€™", "'"],
  ["â€˘", "-"],
];

function cleanMojibakeText(value) {
  if (typeof value !== "string") return value;

  let cleaned = value;
  for (const [from, to] of MOJIBAKE_TO_ASCII) {
    cleaned = cleaned.split(from).join(to);
  }

  return cleaned
    .replace(/\s+/g, " ")
    .replace(/\s+([.,!?;:])/g, "$1")
    .trim();
}

function cleanTranslatedFood(food) {
  if (!food) return food;
  return {
    ...food,
    name: cleanMojibakeText(food.name),
    ingredients: Array.isArray(food.ingredients)
      ? food.ingredients.map((item) => cleanMojibakeText(item))
      : food.ingredients,
    steps: Array.isArray(food.steps)
      ? food.steps.map((item) => cleanMojibakeText(item))
      : food.steps,
  };
}

export function translateMealLabel(label, lang) {
  if (!lang || lang === "en") return label;
  return cleanMojibakeText(MEAL_LABELS[lang]?.[label] || label);
}

export function translateFood(food, lang) {
  if (!food || !lang || lang === "en") return food;
  if (lang === "hr" && hr[food.name]) {
    const tr = hr[food.name];
    return cleanTranslatedFood({ ...food, name: tr.name, ingredients: tr.ingredients, steps: tr.steps });
  }
  return food;
}
