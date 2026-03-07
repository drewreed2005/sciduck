
// general variables for the current state of program

const Seasons = {
    SPRING: 0,
    SUMMER: 1,
    AUTUMN: 2,
    WINTER: 3
}
const Stats = {
    INDUSTRY: 0,
    MILITARY: 1,
    NATIONALISM: 2,
    UNREST: 3
}
const StatsName = {
    [Stats.INDUSTRY]: "Industry",
    [Stats.MILITARY]: "Military",
    [Stats.NATIONALISM]: "Nationalism",
    [Stats.UNREST]: "Unrest"
}


function combineYearAndSeason(year, season) {
    return year * 10 + season;
}

function splitYearAndSeason(combined) {
    return {
        year: Math.floor(combined / 10),
        season: combined % 10
    };
}

// formula for quarterly income based on industry stat
function convertIndustryStatToQuarterlyIncome(industryStat) {
    return Math.floor(20 + 0.33 * industryStat - 0.0003 * industryStat * industryStat)
}


// class representing the current state of the program
class SimState {
    static SIM_INSTANCE = null;

    // caps for stats in the simulation
    static STAT_MIN = 0;
    static STAT_MAX = 1000;

    // state at the start of the simulation
    static INITIAL_YEAR = 1870;
    static NUM_YEARS = 20;
    static INITIAL_SEASON = Seasons.SPRING;
    static INITIAL_INDUSTRY = 20;
    static INITIAL_MILITARY = 20;
    static INITIAL_NATIONALISM = 20;
    static INITIAL_UNREST = 200;
    static INITIAL_STATS = [
        SimState.INITIAL_INDUSTRY,
        SimState.INITIAL_MILITARY,
        SimState.INITIAL_NATIONALISM,
        SimState.INITIAL_UNREST
    ];
    static INITIAL_BUDGET = 150;

    constructor(year = SimState.INITIAL_YEAR, season = SimState.INITIAL_SEASON,
                stats = SimState.INITIAL_STATS, budget = SimState.INITIAL_BUDGET) {
        this.year = year;
        this.season = season;
        this.stats = [...stats];    // shallow copying given stats
        this.budget = budget;
        this.eventManager = new SimEventHandler();

        this.won = false;
        this.lost = false;
    }


    static instance() {
        if (SimState.SIM_INSTANCE === null)
            SimState.SIM_INSTANCE = new SimState();

        return SimState.SIM_INSTANCE;
    }

    startSim() {
        SimUI.emptyMainPanel();
        
        // generate the first events
        this.eventManager.prepareYearEvents(this.year);
        const currentEvent = this.eventManager.getEventFromDate(this.year, this.season);
        if (currentEvent !== null) {
            SimUI.addToMainWindow(currentEvent.createEventBox(), true);
            SimUI.addToMainWindow(document.createElement("br"));
            SimUI.addToMainWindow(document.createElement("br"));
        } else {
            this.progressTime();
        }
    }


    // affecting the instance

    changeStat(statIndex, amount) {
        // keeping the stat amount within valid range
        this.stats[statIndex] = Math.max(0, Math.min(SimState.STAT_MAX, this.stats[statIndex] + amount))
    }
    
    updateFinance() {
        const quarterlyIncome = convertIndustryStatToQuarterlyIncome(this.stats[Stats.INDUSTRY]);
        this.budget += quarterlyIncome;

        // decrease unrest based on stats if we want that to be a thing

        // update sim UI content
        SimUI.updateDisplays(this.year, this.budget, quarterlyIncome,
                            this.stats[Stats.INDUSTRY], this.stats[Stats.MILITARY],
                            this.stats[Stats.NATIONALISM], this.stats[Stats.UNREST],
                            SimState.STAT_MAX);
    }

    // progressing time forward

    progressTime() {
        while (true) {
            // check if we're in win/failure state
            // if so, just provide the button to end the simulation
            if (this.won || this.lost) {
                const endButton = SimUI.createButtonElement("End Simulation");
                endButton.onclick = () => this.endSimulation();
                SimUI.addToMainWindow(endButton, true);
                SimUI.updateDisplays(this.year, this.budget, convertIndustryStatToQuarterlyIncome(this.stats[Stats.INDUSTRY]),
                            this.stats[Stats.INDUSTRY], this.stats[Stats.MILITARY],
                            this.stats[Stats.NATIONALISM], this.stats[Stats.UNREST],
                            SimState.STAT_MAX);
                return;
            }

            // if the current season is winter, provide the option to go to the next year
            if (this.season === Seasons.WINTER) {
                const nextYearButton = SimUI.createButtonElement("Next Year", (this.year + 1).toString());
                nextYearButton.style.width = "4vw";
                nextYearButton.onclick = () => this.progressYear();
                SimUI.addToMainWindow(nextYearButton, true);
                // should still update current display
                SimUI.updateDisplays(this.year, this.budget, convertIndustryStatToQuarterlyIncome(this.stats[Stats.INDUSTRY]),
                            this.stats[Stats.INDUSTRY], this.stats[Stats.MILITARY],
                            this.stats[Stats.NATIONALISM], this.stats[Stats.UNREST],
                            SimState.STAT_MAX);
                return;
            }
            // (winter income will be received when the year is progressed)

            // receive income and update visual elements
            this.updateFinance();

            // otherwise, increment the season and check for a new event
            ++this.season;
            const currentEvent = this.eventManager.getEventFromDate(this.year, this.season);
            if (currentEvent !== null) {
                SimUI.addToMainWindow(currentEvent.createEventBox(), true);
                SimUI.addToMainWindow(document.createElement("br"));
                SimUI.addToMainWindow(document.createElement("br"));
                return;
            }
        }
    }

    progressYear() {
        ++this.year;
        SimUI.emptyMainPanel();

        // pre-generate events/special events for this year
        this.eventManager.prepareYearEvents(this.year);

        // progress to spring of the new year
        this.season = Seasons.SPRING - 1;       // to be incremented in progressTime()
        this.progressTime();
    }


    // ending the simulation (as a win or loss)
    endSimulation() {
        // emptying the main UI
        SimUI.emptyMainPanel();

        // creating a box to note the final state
        const endBox = SimUI.createEventBox();
        const endStatementContent = SimUI.createBoxContent();
        if (this.won)
            endStatementContent.innerText = "Congratulations! Through your efforts, Meiji Japan has achieved marked success, modernizing in the Western image in just a short time. There is still a ways to go before the world sees Japan for the global power it strives to be.\n\n";
        else
            endStatementContent.innerText = "Unfortunately, Meiji Japan has succumbed to unrest and failed to achieve the full breadth of modernization it set its sights on. Perhaps, with a bit better strategy, Japan could thrive on the global stage.\n\n";
        const endStatsContent = SimUI.createBoxContent(true); // centered box content
        endStatsContent.innerText = `FINAL STATS:\n${this.statsToString()}`

        // inserting the content into the box and the box into the main window
        endBox.appendChild(endStatementContent);
        endBox.appendChild(endStatsContent);
        SimUI.addToMainWindow(endBox);
    }

    statsToString() {
        return `INDUSTRY: ${this.stats[Stats.INDUSTRY]} / ${SimState.STAT_MAX}\nMILITARY: ${this.stats[Stats.MILITARY]} / ${SimState.STAT_MAX}\nNATIONALISM: ${this.stats[Stats.NATIONALISM]} / ${SimState.STAT_MAX}\nUNREST: ${this.stats[Stats.UNREST]} / ${SimState.STAT_MAX}\nREMAINING BUDGET: ${this.budget}¥`;
    }

    // resetting the simulation

    reset() {
        SimUI.emptyMainPanel();

        this.year = SimState.INITIAL_YEAR;
        this.season = SimState.INITIAL_SEASON;
        this.stats = [...SimState.INITIAL_STATS];
        this.budget = SimState.INITIAL_BUDGET;
        this.eventManager = new SimEventHandler();
        this.won = false;
        this.lost = false;

        SimUI.updateDisplays(this.year, this.budget, convertIndustryStatToQuarterlyIncome(this.stats[Stats.INDUSTRY]),
                            this.stats[Stats.INDUSTRY], this.stats[Stats.MILITARY],
                            this.stats[Stats.NATIONALISM], this.stats[Stats.UNREST],
                            SimState.STAT_MAX);
        
        // add main menu start button
        const startBox = SimUI.createEventBox();
        const startBoxContent = SimUI.createBoxContent();
        const startBoxText = document.createElement("p");
        startBoxText.innerText = "In Genrō Simulator, you take the reigns as a shishi-turned-oligarch in 1870, looking ahead at an era of modernization. Along with your fellow Dajō-kan members, it is your responsibility to make calls that further Japan's modernization efforts without stirring excessive controversy and unrest.";
        const startButtonContainer = SimUI.createButtonContainer();
        const startButton = SimUI.createButtonElement("Start Simulation", SimState.INITIAL_YEAR.toString());
        startButton.onclick = () => this.startSim();

        // inserting contents
        startButtonContainer.appendChild(startButton);
        startBoxContent.appendChild(startBoxText);
        startBoxContent.appendChild(startButtonContainer);
        startBox.appendChild(startBoxContent);
        SimUI.addToMainWindow(startBox);
    }
}


// class representing frontend elements of the program
class SimUI {
    // left panel interactive elements
    static yearDisplay = document.getElementById("year-display");
    static budgetDisplay = document.getElementById("budget-display");
    static incomeDisplay = document.getElementById("income-display");

    // center panel
    static mainSimWindow = document.getElementById("main-sim-panel");

    // right panel interactive elements
    static industryBar = document.getElementById("industry-bar");
    static militaryBar = document.getElementById("military-bar");
    static nationalismBar = document.getElementById("nationalism-bar");
    static unrestBar = document.getElementById("unrest-bar");
    static resetButton = document.getElementById("reset-button");

    // mapping for season number to label class info
    static seasonToInfo = {
        [Seasons.SPRING]: { uniqueClass: "box-label-spring", kanji: "春", text: "Spring" },
        [Seasons.SUMMER]: { uniqueClass: "box-label-summer", kanji: "夏", text: "Summer" },
        [Seasons.AUTUMN]: { uniqueClass: "box-label-autumn", kanji: "秋", text: "Autumn" },
        [Seasons.WINTER]: { uniqueClass: "box-label-winter", kanji: "冬", text: "Winter" }
    }

    static updateDisplays(year, budget, income, industryStat, militaryStat, nationalismStat,
                          unrestStat, statMax = SimState.STAT_MAX) {
        // updating left side info
        SimUI.yearDisplay.innerText = year.toString();
        SimUI.budgetDisplay.innerText = `${budget}¥`;
        SimUI.incomeDisplay.innerText = `${income}¥`;
        
        // updating stat bars
        SimUI.industryBar.style.width = `${Math.ceil(industryStat / statMax * 100)}%`;
        SimUI.militaryBar.style.width = `${Math.ceil(militaryStat / statMax * 100)}%`;
        SimUI.nationalismBar.style.width = `${Math.ceil(nationalismStat / statMax * 100)}%`;
        SimUI.unrestBar.style.width = `${Math.ceil(unrestStat / statMax * 100)}%`;
    }

    static addToMainWindow(element, animateIn = false) {
        SimUI.mainSimWindow.appendChild(element);
        if (animateIn)
            requestAnimationFrame(() => {
                element.classList.add("show");
            });
    }

    static createEventBox() {
        // creating box object to be returned
        const boxDiv = document.createElement("div");
        boxDiv.classList.add("box");
        return boxDiv;
    }

    static createEventBoxWithLabel(season) {
        // creating outer box to be labeled
        const boxDiv = document.createElement("div");
        boxDiv.classList.add("box", "with-label");

        // creating label for box
        const seasonInfo = SimUI.seasonToInfo[season];
        const labelDiv = document.createElement("div");
        labelDiv.classList.add("box-label", seasonInfo.uniqueClass);

        // creating the left and right of the label
        const labelLeft = document.createElement("span");
        labelLeft.classList.add("label-left");
        labelLeft.textContent = seasonInfo.kanji;
        const labelRight = document.createElement("span");
        labelRight.classList.add("label-right");
        labelRight.textContent = seasonInfo.text;

        // nesting the info as intended
        labelDiv.appendChild(labelLeft);
        labelDiv.appendChild(labelRight);
        boxDiv.appendChild(labelDiv);

        // returning the the whole box
        // (box content div isn't added yet so that this can more easily be done later)
        return boxDiv;
    }

    static createBoxContent(centered = false) {
        // creating content box and assigning class
        const contentDiv = document.createElement("div");
        if (centered) contentDiv.classList.add("box-content", "centered-content");
        else contentDiv.classList.add("box-content");
        return contentDiv;
    }

    static createButtonContainer() {
        const buttonContainer = document.createElement("div");
        buttonContainer.classList.add("button-container");
        return buttonContainer;
    }

    static createButtonElement(upperText, lowerText = "") {
        const button = document.createElement("button");
        button.classList.add("option-button");

        // creating the upper and lower text
        const upperTextElement = document.createElement("span");
        upperTextElement.classList.add("upper-text");
        upperTextElement.innerText = upperText;
        const lowerTextElement = document.createElement("span");
        lowerTextElement.classList.add("lower-text");
        lowerTextElement.innerText = lowerText;

        // adding the upper and lower text to the button
        button.appendChild(upperTextElement);
        button.appendChild(lowerTextElement);

        return button;
    }

    static emptyMainPanel() {
        // resetting the main panel to empty
        SimUI.mainSimWindow.innerHTML = "";
    }
}


// class representing a basic event during simulation
class SimEvent {
    constructor(name, cost, result_text, stat_changes, win_condition = false,
                failure_condition = false, consequent_event_info = null) {
        this.name = name;
        this.cost = cost;
        this.result_text = result_text;
        this.stat_changes = stat_changes;
        this.win_condition = win_condition; // true if choosing this event wins and ends the simulation
        this.failure_condition = failure_condition; // true if choosing this loses and ends the simulation
        this.consequent_event_info = consequent_event_info;

        // stat_changes format:
        //  {
        //      Stats.STAT_NAME: amount_of_increase/decrease,
        //      etc.
        //  }
        // Stat changes not listed in result_text
        
        // consequent_event_info is a dictionary containing:
        //  {
        //      event: SpecialEvent object
        //      year: year associated with that event
        //      season: season associated with that event
        //  }
    }

    createButton(buttonContainer, resultContainer) {
        const button = SimUI.createButtonElement(this.name, `${this.cost}¥`);
        button.onclick = () => this.applyEvent(button, buttonContainer, resultContainer);
        return button;
    }

    applyEvent(button, buttonContainer, resultContainer) {
        // check if the event is selectable within budget
        if (this.cost > SimState.instance().budget) return;

        // deactivate all buttons in the button container
        const buttons = buttonContainer.querySelectorAll(".option-button");
        buttons.forEach(button => button.classList.add("disabled"));
        button.classList.add("selected");

        // affect stats
        SimState.instance().budget -= this.cost;
        for (const stat in this.stat_changes)
            SimState.instance().changeStat(stat, this.stat_changes[stat]);

        // if there is a consequent event, insert it where it belongs
        if (this.consequent_event_info !== null) {
            SimState.instance().eventManager.events[combineYearAndSeason(
                this.consequent_event_info.year, this.consequent_event_info.season
            )] = this.consequent_event_info.event;
        }

        // change to win/loss state if necessary
        SimState.instance().won = this.win_condition;
        SimState.instance().lost = this.failure_condition;

        // add results + benefits + detriments to result container
        const resultTextElement = document.createElement("p");
        resultTextElement.innerText = this.result_text;
        const statChangeElement = document.createElement("p");
        statChangeElement.innerText = this.statChangesToString();
        resultContainer.appendChild(resultTextElement);
        resultContainer.appendChild(statChangeElement);

        // handle time progression in simulation
        SimState.instance().progressTime();
    }

    statChangesToString() {
        // convert stat changes to formatted increase/decrease statements
        const benefits = {};
        const detriments = {};
        for (const stat in this.stat_changes) {
            if (this.stat_changes[stat] > 0)
                benefits[stat] = this.stat_changes[stat];
            else if (this.stat_changes[stat] < 0)
                detriments[stat] = this.stat_changes[stat];
        }

        let benefitString = "";
        for (const stat in benefits) {
            if (benefitString.length !== 0) benefitString += ", ";
            benefitString += `${StatsName[stat]} +${benefits[stat]}`;
        }
        let detrimentString = "";
        for (const stat in detriments) {
            if (detrimentString.length !== 0) detrimentString += ", ";
            detrimentString += `${StatsName[stat]} ${detriments[stat]}`;
        }
        if (benefitString.length > 0 && detrimentString.length > 0)
            return `${benefitString}\n${detrimentString}`;
        else return benefitString + detrimentString;
    }
}


class SimMultiEvent {
    constructor(costEvents, freeEvent) {
        this.costEvents = costEvents;
        this.freeEvent = freeEvent;
    }

    createEventBox() {
        // creating a season-labeled box for the event
        const eventBox = SimUI.createEventBoxWithLabel(SimState.instance().season);

        // creating the box content container
        const contentContainer = SimUI.createBoxContent();

        // creating the button container and adding the buttons
        const buttonContainer = SimUI.createButtonContainer();
        buttonContainer.classList.add("button-container");
        buttonContainer.appendChild(this.freeEvent.createButton(buttonContainer, contentContainer));
        for (const event of this.costEvents)
            buttonContainer.appendChild(
                event.createButton(buttonContainer, contentContainer)
            );

        // appending the buttons to the content and the content to the box
        contentContainer.appendChild(buttonContainer);
        eventBox.appendChild(contentContainer);

        return eventBox;
    }
}


class SimSpecialEvent {
    constructor(name, season, pretext, subevents, requirements = null, alternate = null) {
        this.name = name;
        this.season = season;
        this.pretext = pretext;
        this.subevents = subevents;
        this.requirements = requirements;
        this.alternate = null;
    }

    createEventBox() {
        // creating a season-labeled box for the event
        const eventBox = SimUI.createEventBoxWithLabel(SimState.instance().season);

        // creating the box content container
        const contentContainer = SimUI.createBoxContent();

        // adding special event info
        const eventName = document.createElement("p");
        eventName.textContent = `EVENT: ${this.name}`;
        const eventPretext = document.createElement("p");
        eventPretext.textContent = this.pretext;

        // inserting text content before inserting buttons
        contentContainer.appendChild(eventName);
        contentContainer.appendChild(eventPretext);

        // creating the button container and adding the buttons
        const buttonContainer = SimUI.createButtonContainer();
        buttonContainer.classList.add("button-container");
        for (const event of this.subevents)
            buttonContainer.appendChild(
                event.createButton(buttonContainer, contentContainer)
            );

        
        // appending the buttons to the content and the content to the box
        contentContainer.appendChild(buttonContainer);
        eventBox.appendChild(contentContainer);

        return eventBox;
    }
}


// class to generate random events in the first decade of the simulation
class FirstDecadeEvents {
    static Costs = {
        FREE: 0,
        LOW: 50,
        MODERATE: 100,
        HIGH: 150,
        VERY_HIGH: 250
    }
    
    static COST_EVENTS = [
        new SimEvent("Commission Railway Survey", FirstDecadeEvents.Costs.LOW,
            "Surveyors are sent to chart routes for a future railway network, enabling future expansion. The promise of increased connectivity creates national optimism.",
            {
                [Stats.INDUSTRY]: 10,
                [Stats.NATIONALISM]: 10,
                [Stats.UNREST]: -10
            }
        ),
        new SimEvent("Construct Textile Mill", FirstDecadeEvents.Costs.HIGH,
            "A state-sponsored, brick-built textile mill shows the efficiency of mechanized, Western-inspired production. Women who previously worked in small-scale sericulture businesses quickly find employment at the mill. The new industrial export economy is supported.",
            {
                [Stats.INDUSTRY]: 40,
                [Stats.UNREST]: 5
            }
        ),
        new SimEvent("Standardize Currency", FirstDecadeEvents.Costs.MODERATE,
            "As regional currencies are replaced with unified tender, trade becomes smoother and people see themselves as a part of one grand economic system.",
            {
                [Stats.INDUSTRY]: 10,
                [Stats.NATIONALISM]: 20
            }
        ),
        new SimEvent("Build Telegraph Lines", FirstDecadeEvents.Costs.MODERATE,
            "Instant communication is hugely beneficial to logistics. The speed of information has great implications for industry and military alike.",
            {
                [Stats.INDUSTRY]: 15,
                [Stats.MILITARY]: 10,
                [Stats.NATIONALISM]: 5
            }
        ),
        new SimEvent("Fund Shipyard", FirstDecadeEvents.Costs.VERY_HIGH,
            "A modern shipyard, capable of constructing steam-powered sea vessels, is funded. This is both a commercial and defensive boon.",
            {
                [Stats.INDUSTRY]: 20,
                [Stats.MILITARY]: 35,
                [Stats.UNREST]: -10
            }
        ),
        new SimEvent("Open Technical Institute", FirstDecadeEvents.Costs.HIGH,
            "Young students at this new school study engineering and science taken from Western texts.",
            {
                [Stats.INDUSTRY]: 30,
                [Stats.NATIONALISM]: 20,
                [Stats.UNREST]: -10
            }
        ),
        new SimEvent("Translate European Law", FirstDecadeEvents.Costs.LOW,
            "Modern legal frameworks are studied and adapted. The nation appears more \"civilized\" in the eyes of foreign powers.",
            {
                [Stats.MILITARY]: 15,
                [Stats.NATIONALISM]: 10,
                [Stats.UNREST]: -15
            }
        ),
        new SimEvent("Send Students Abroad", FirstDecadeEvents.Costs.LOW,
            "Young scholars are sent West to Europe and the U.S. to learn advanced sciences and military tactics. Some come back inspired.",
            {
                [Stats.INDUSTRY]: 15,
                [Stats.MILITARY]: 15,
                [Stats.NATIONALISM]: -10
            }
        ),
        new SimEvent("Enforce Compulsory Education", FirstDecadeEvents.Costs.MODERATE,
            "Children begin to attend standardized schools across the country. While this benefits literacy and creates a nationalistic youth, some parents would rather their children focus on labor.",
            {
                [Stats.INDUSTRY]: 15,
                [Stats.NATIONALISM]: 25,
                [Stats.UNREST]: 10
            }
        ),
        new SimEvent("Push for Conscription", FirstDecadeEvents.Costs.LOW,
            "All classes are subject to military service now. Many members of the old warrior order are uncertain.",
            {
                [Stats.MILITARY]: 30,
                [Stats.UNREST]: 10
            }
        ),
        new SimEvent("Buy Modern Rifles", FirstDecadeEvents.Costs.MODERATE,
            "Military training remains slightly behind technology, but firepower increases immediately as modern firearms are imported in bulk.",
            {
                [Stats.MILITARY]: 30
            }
        ),
        new SimEvent("Consult Military Advice", FirstDecadeEvents.Costs.LOW,
            "A European officer is appointed to reorganize and modernize the army and its training. This improved discipline and strategy comes at the cost of pride.",
            {
                [Stats.MILITARY]: 30,
                [Stats.NATIONALISM]: -10
            }
        ),
        new SimEvent("Invest in Naval Force", FirstDecadeEvents.Costs.HIGH,
            "Steam power and iron-hulled ships increase maritime power, which is increasingly important to military officials.",
            {
                [Stats.INDUSTRY]: 15,
                [Stats.MILITARY]: 30,
                [Stats.UNREST]: -5
            }
        ),
        new SimEvent("Imperial Procession", FirstDecadeEvents.Costs.HIGH,
            "Emperor Meiji and Empress Shōken are wheeled in a Western-style carriage across populous areas with vibrant fanfare. The public, enthralled by the heightened presentation, is further united under the glorified Emperor and sees a rise in national fervor.",
            {
                [Stats.NATIONALISM]: 45,
                [Stats.UNREST]: -20
            }
        )
    ]
    static FREE_EVENTS = [
        new SimEvent("Encourage Zaibatsu Formation", FirstDecadeEvents.Costs.FREE,
            "Managerially-experienced families are contracted favorably to build industry. There are rumors, however, that national power is going to the hands of private enterprise.",
            {
                [Stats.INDUSTRY]: 10,
                [Stats.UNREST]: 15
            }
        ),
        new SimEvent("Land Tax Reform", FirstDecadeEvents.Costs.FREE,
            "Taxes on agriculture are monetized. This stabilizes state revenue but displeases peasants.",
            {
                [Stats.INDUSTRY]: 15,
                [Stats.UNREST]: 30
            }
        ),
        new SimEvent("Adopt Western Dress", FirstDecadeEvents.Costs.FREE,
            "You and fellow officials appear in suits rather than robes. This redefinition of fashion is inspiring, but scares many.",
            {
                [Stats.INDUSTRY]: 5,
                [Stats.NATIONALISM]: 15,
                [Stats.UNREST]: 10
            }
        ),
        new SimEvent("Work on Constitution Drafting", FirstDecadeEvents.Costs.FREE,
            "Intellectuals are brought together to work toward drafting a modern, Western-style constitution. Though not close to ready, the promises of the Charter Oath are seeing attention.",
            {
                [Stats.INDUSTRY]: 5,
                [Stats.NATIONALISM]: 20,
                [Stats.UNREST]: -20
            }
        ),
        new SimEvent("Encourage Urban Migration", FirstDecadeEvents.Costs.FREE,
            "Rural workers increasingly move to cities seeking factory work. Traditional village life is affected, as are rural citizens' perspectives on urbanism.",
            {
                [Stats.INDUSTRY]: 15,
                [Stats.UNREST]: 25
            }
        ),
        new SimEvent("Promote Bunmei Kaika", FirstDecadeEvents.Costs.FREE,
            "Posters, pamphlets, and artwork celebrate the virtues of modernization.",
            {
                [Stats.NATIONALISM]: 15,
                [Stats.UNREST]: -10
            }
        ),
        new SimEvent("Enforce State Shinto", FirstDecadeEvents.Costs.FREE,
            "Surveyors are sent to enforce that residents worship the divine Emperor and his absolute authority. In doing so, the nation grows more unified under this invented religious traditionalism, but some harbor growing resentment.",
            {
                [Stats.NATIONALISM]: 25,
                [Stats.UNREST]: 10
            }
        )
    ]
}

class SecondDecadeEvents {
    static Costs = {
        FREE: 0,
        LOW: 100,
        MODERATE: 200,
        HIGH: 400,
        VERY_HIGH: 500
    }

    static COST_EVENTS = [
        new SimEvent("Expand Railway Lines", SecondDecadeEvents.Costs.MODERATE,
            "The expansion of existing railways to new areas opens up doors to additional industry and may benefit military endeavors.",
            {
                [Stats.INDUSTRY]: 20,
                [Stats.MILITARY]: 10,
                [Stats.UNREST]: -10
            }
        ),
        new SimEvent("Expand Textile Mill", SecondDecadeEvents.Costs.HIGH,
            "A textile mill is expanded to include a small school and additional facilities to appeal to prospective employees.",
            {
                [Stats.INDUSTRY]: 40,
                [Stats.UNREST]: 5
            }
        ),
        new SimEvent("Expand Telegraph Lines", SecondDecadeEvents.Costs.MODERATE,
            "Instant communication is hugely beneficial to logistics. The speed of information has great implications for industry and military alike.",
            {
                [Stats.INDUSTRY]: 25,
                [Stats.MILITARY]: 15,
                [Stats.NATIONALISM]: 10
            }
        ),
        new SimEvent("Fund Shipyard", SecondDecadeEvents.Costs.VERY_HIGH,
            "A modern shipyard, capable of constructing steam-powered sea vessels, is funded. This is both a commercial and defensive boon.",
            {
                [Stats.INDUSTRY]: 35,
                [Stats.MILITARY]: 45
            }
        ),
        new SimEvent("Fund Technical Institute", SecondDecadeEvents.Costs.HIGH,
            "Young students at this school have increased access to crucial information.",
            {
                [Stats.INDUSTRY]: 30,
                [Stats.MILITARY]: 20,
                [Stats.NATIONALISM]: 20
            }
        ),
        new SimEvent("Translate European Law", SecondDecadeEvents.Costs.LOW,
            "Modern legal frameworks are studied and adapted. The nation appears more \"civilized\" in the eyes of foreign powers.",
            {
                [Stats.MILITARY]: 15,
                [Stats.NATIONALISM]: 10,
                [Stats.UNREST]: -15
            }
        ),
        new SimEvent("Invest in Naval Force", SecondDecadeEvents.Costs.HIGH,
            "Steam power and iron-hulled ships increase maritime power, which is increasingly important to military officials.",
            {
                [Stats.INDUSTRY]: 15,
                [Stats.MILITARY]: 30,
                [Stats.UNREST]: -5
            }
        ),
        new SimEvent("Imperial Procession", SecondDecadeEvents.Costs.HIGH,
            "Emperor Meiji and Empress Shōken are wheeled in a Western-style carriage across populous areas with vibrant fanfare. The public, enthralled by the heightened presentation, is further united under the glorified emperor and sees a rise in national fervor.",
            {
                [Stats.NATIONALISM]: 45,
                [Stats.UNREST]: -20
            }
        ),
        new SimEvent("Commission Military Propaganda", SecondDecadeEvents.Costs.LOW,
            "Despite no present conflicts, woodblock artists are commissioned to depict Emperor Meiji leading a massive army. Nationalist fervor grows and a sense of sacrificial duty to the Emperor is bolstered.",
            {
                [Stats.MILITARY]: 30,
                [Stats.NATIONALISM]: 20,
            }
        ),
        new SimEvent("Invest in Zaibatsu", SecondDecadeEvents.Costs.VERY_HIGH,
            "The transmission of money around to different branches freely creates a highly effective system of production.",
            {
                [Stats.INDUSTRY]: 75,
                [Stats.UNREST]: 15
            }
        ),
        new SimEvent("Commission High Society Art", SecondDecadeEvents.Costs.LOW,
            "Artwork depicting fashionable women with Western hairstyles and dresses is circulated. Society further associates the West with modernity.",
            {
                [Stats.NATIONALISM]: 30,
                [Stats.UNREST]: -10
            }
        ),
        new SimEvent("Expand Coal Mining", SecondDecadeEvents.Costs.HIGH,
            "Coal production increases to meet the demands of factories and railways. Labor complaints and concern from locals stir unrest.",
            {
                [Stats.INDUSTRY]: 35,
                [Stats.MILITARY]: 10,
                [Stats.UNREST]: 15
            }
        ),
        new SimEvent("Improve Rural Roads", SecondDecadeEvents.Costs.LOW,
            "Investment in rural road networks improves trade and reduces isolation in rural communities.",
            {
                [Stats.INDUSTRY]: 25,
                [Stats.UNREST]: -35
            }
        ),
        new SimEvent("Stage Yasukuni Shrine Visit", SecondDecadeEvents.Costs.MODERATE,
            "The Emperor visits Yasukuni Shrine, in doing so reinforcing national unity under his divine self."
        )
    ];

    static FREE_EVENTS = [
        new SimEvent("Adopt Western Dress", SecondDecadeEvents.Costs.FREE,
            "You and fellow officials appear in suits rather than robes. This redefinition of fashion is inspiring, but scares many.",
            {
                [Stats.INDUSTRY]: 5,
                [Stats.NATIONALISM]: 15,
                [Stats.UNREST]: 10
            }
        ),
        new SimEvent("Work on Constitution Drafting", SecondDecadeEvents.Costs.FREE,
            "Intellectuals are brought together to draft a modern, Western-style constitution. Though not close to ready, the promises of the Charter Oath are seeing attention.",
            {
                [Stats.INDUSTRY]: 5,
                [Stats.NATIONALISM]: 20,
                [Stats.UNREST]: -20
            }
        ),
        new SimEvent("Encourage Urban Migration", SecondDecadeEvents.Costs.FREE,
            "Peasants increasingly move to cities seeking factory work. Traditional village life is affected, as are rural citizens' perspectives on urbanism.",
            {
                [Stats.INDUSTRY]: 15,
                [Stats.UNREST]: 25
            }
        ),
        new SimEvent("Promote Bunmei Kaika", SecondDecadeEvents.Costs.FREE,
            "Posters, pamphlets, and artwork celebrate the virtues of modernization.",
            {
                [Stats.NATIONALISM]: 15,
                [Stats.UNREST]: -10
            }
        ),
        new SimEvent("Enforce State Shinto", SecondDecadeEvents.Costs.FREE,
            "Surveyors are sent to enforce that residents worship the divine Emperor and his absolute authority. In doing so, the nation grew more unified under this manufactured religious patriotism, but some harbor growing resentment.",
            {
                [Stats.NATIONALISM]: 25,
                [Stats.UNREST]: 10
            }
        ),
        new SimEvent("Emphasize Bushidō", FirstDecadeEvents.Costs.FREE,
            "The \"way of the warrior\" is emphasized in military code; duty is said to be \"heavier than a mountain,\" and death in service \"lighter than a feather.\" Willingness to sacrifice for the Emperor is at a peak.",
            {
                [Stats.MILITARY]: 20,
                [Stats.NATIONALISM]: 10
            }
        ),
        new SimEvent("Encourage Private Investment", FirstDecadeEvents.Costs.FREE,
            "Officials encourage private merchants and investors to expand into manufacturing. Private industry grows steadily.",
            {
                [Stats.INDUSTRY]: 25
            }
        )
    ];
}

class SimEventHandler {
    // handles selecting from the pool of events for a particular chosen day

    static EVENTS_PER_YEAR = 2;

    static BASE_SPECIAL_EVENTS = {
        [combineYearAndSeason(1871, Seasons.WINTER)]: new SimSpecialEvent("The Iwakura Mission", Seasons.WINTER,
            "Leadership is debating whether to send statesmen and students abroad to study Western governments, technology, and military systems. It will be a long and expensive journey, and some warn that sending leaders overseas may weaken governance domestically.",
            [
                new SimEvent("Fund the Mission", 100,
                    "Leaders leave for their \"global shopping spree,\" touring the U.S. and Europe. Those who stayed home (you included) cross your fingers for their return with Western knowledge.",
                    {
                        [Stats.NATIONALISM]: -20,
                        [Stats.UNREST]: 10
                    }, false, false, // win condition/failure condition info
                    {                // consequent event info
                        event: new SimSpecialEvent("Return of the Iwakura Mission", Seasons.SPRING,
                            "After almost two years abroad, the statesmen return with extensive observations on Western industry, government, and military! Their recommendations could be highly useful.",
                            [
                                new SimEvent("Hire Industrial Advisors", 75,
                                    "Western engineers and managers are hired to handle mines, factories, and infrastructure projects. Industrial development booms even greater.",
                                    {
                                        [Stats.INDUSTRY]: 75,
                                        [Stats.UNREST]: 10
                                    }
                                ),
                                new SimEvent("Hire Military Advisors", 75,
                                    "European command structures are adopted within the growing Japanese military. New training programs cause a transformation into a modern national army.",
                                    {
                                        [Stats.MILITARY]: 75,
                                        [Stats.UNREST]: 10
                                    }
                                ),
                                new SimEvent("Reform Government Institutions", 50,
                                    "Returning leaders push reforms inspired by the West. Modernization has a stronger central direction.",
                                    {
                                        [Stats.INDUSTRY]: 20,
                                        [Stats.MILITARY]: 20,
                                        [Stats.NATIONALISM]: 20,
                                        [Stats.UNREST]: 10
                                    }
                                )
                            ]
                        ),
                        year: 1873,
                        season: Seasons.SPRING
                    }
                ),
                new SimEvent("Decline the Mission", 0,
                    "Officials act conservatively, instead focusing on modernization at home rather than sending leaders abroad.",
                    {
                        [Stats.INDUSTRY]: -15,
                        [Stats.NATIONALISM]: 20
                    }
                )
            ]
        ),
        [combineYearAndSeason(1872, Seasons.WINTER)]: new SimSpecialEvent("The Conscription Act", Seasons.WINTER,
            "The government proposes universal military conscription that would require all young men to serve. Many rural communities in need of young men's labor would resent the measure.",
            [
                new SimEvent("Pursue Universal Conscription", 50,
                    "Men at the age of 20 are required to take 7 years of military service (3 active, 4 in reserve). This sparks bloody rebellion for farmers, who are crippled without young men.",
                    {
                        [Stats.MILITARY]: 90,
                        [Stats.NATIONALISM]: -20,
                        [Stats.UNREST]: 80
                    }
                ),
                new SimEvent("Pursue Moderated Conscription", 120,
                    "Conscription is implemented, but gradually and with exemptions. The army steadily grows without causing overly explosive resistance.",
                    {
                        [Stats.MILITARY]: 50,
                        [Stats.UNREST]: 30
                    }
                ),
                new SimEvent("Delay Implementation", 0,
                    "Conscription is postponed. In its place, there is an expansion of focus on voluntary recruitment, which avoids backlash but slows modernization.",
                    {
                        [Stats.MILITARY]: 10,
                        [Stats.NATIONALISM]: 30,
                        [Stats.UNREST]: -20
                    }
                )
            ]
        ),
        [combineYearAndSeason(1875, Seasons.SUMMER)]: new SimSpecialEvent("The Kanghwa Incident", Seasons.SUMMER,
            "Japan's naval vessels patrol near Kanghwa Island. Some officials encourage a trial run of gunboat diplomacy in an effort toward opening favorable Korean relations.",
            [
                new SimEvent("Provoke", 150,
                    "Ships creep into Korean waters in an act of deliberate provocation. When Korea fires back, Japan retaliates strongly.",
                    {
                        [Stats.MILITARY]: 25,
                        [Stats.NATIONALISM]: 30,
                        [Stats.UNREST]: 20
                    }, false, false,    // win condition and failure condition info
                    {                   // consequent event info
                        event: new SimSpecialEvent("The Treaty of Kanghwa", Seasons.SPRING,
                            "After the prior year's naval confrontation, Korea is forced to negotiate terms. Leaders debate the proper level of aggressiveness.",
                            [
                                new SimEvent("Impose Unequal Treaty", 0,
                                    "Korea opens three ports to Japanese trade and denies its position as a Qing tributary state. This is a great benefit to Japan, but Korea and China are uneasy.",
                                    {
                                        [Stats.INDUSTRY]: 40,
                                        [Stats.MILITARY]: 10,
                                        [Stats.NATIONALISM]: 30,
                                        [Stats.UNREST]: 20
                                    }
                                ),
                                new SimEvent("Impose Moderate Agreement", 0,
                                    "Japan received limited trade privileges with Korea. Some see this as too weak of a push.",
                                    {
                                        [Stats.INDUSTRY]: 25,
                                        [Stats.NATIONALISM]: 10,
                                        [Stats.UNREST]: 10
                                    }
                                ),
                                new SimEvent("Impose Lenient Treaty", 0,
                                    "In hopes of building diplomatic relations, a weak agreement is reached.",
                                    {
                                        [Stats.INDUSTRY]: 10,
                                        [Stats.MILITARY]: -10,
                                        [Stats.NATIONALISM]: -30,
                                        [Stats.UNREST]: -25
                                    }
                                )
                            ]
                        ),
                        year: 1876,
                        season: Seasons.SPRING
                    }
                ),
                new SimEvent("Avoid Provocation", 0,
                    "In refraining from escalating tensions with Korea, conflict is avoided, but nothing is gained.",
                    {
                        [Stats.MILITARY]: -10,
                        [Stats.NATIONALISM]: -20,
                        [Stats.UNREST]: -30
                    }
                )
            ], { [Stats.MILITARY]: 100 }, // needs 150 military stat to possibly succeed
            null                          // alternate event info
        ),
        [combineYearAndSeason(1877, Seasons.SPRING)]: new SimSpecialEvent("The Satsuma Rebellion", Seasons.SPRING,
            "Unhappy former samurai in Satsuma rebel under Saigō Takamori, who had grown disillusioned with modernization. The government must take decisive action.",
            [
                new SimEvent("Crush the Rebellion", 200,
                    "The building army defeats samurai rebels after intense fighting. The victory shows the national army is capable.",
                    {
                        [Stats.MILITARY]: 20,
                        [Stats.NATIONALISM]: 40,
                        [Stats.UNREST]: -30
                    }
                ),
                new SimEvent("Negotiate with Rebels", 100,
                    "The rebels are appeased by changes to the terms of the modern military and benefits for former samurai. The rebellion fades, but not without doubts of the new government's authority.",
                    {
                        [Stats.MILITARY]: -10,
                        [Stats.NATIONALISM]: -30,
                        [Stats.UNREST]: -50
                    }
                ),
                new SimEvent("Ignore the Rebellion", 0,
                    "The conflict drags on and critiques of Japan's modernization become highly mainstream. You save military resources, but the revolutionaries gain ground. The Meiji government loses its hold over the people.",
                    {
                        [Stats.MILITARY]: 20,
                        [Stats.NATIONALISM]: -800,
                        [Stats.UNREST]: 300
                    },
                    false, true     // this is a loss condition and not a win condition
                )
            ], { [Stats.MILITARY]: 150 },
            new SimSpecialEvent("The Satsuma Rebellion", Seasons.SPRING,
                new SimEvent("Crush the Rebellion", 200,
                    "The building army, not quite equipped is unable to stop the samurai rebels. The Meiji government loses control.",
                    {
                        [Stats.MILITARY]: -100,
                        [Stats.NATIONALISM]: -80,
                        [Stats.UNREST]: 100
                    },
                    false, true     // this is a loss condition with inadequate military stat
                ),
                new SimEvent("Negotiate with Rebels", 100,
                    "The rebels are appeased by changes to the terms of the modern military and benefits for former samurai. The rebellion fades, but not without doubts of the new government's authority.",
                    {
                        [Stats.MILITARY]: -10,
                        [Stats.NATIONALISM]: -30,
                        [Stats.UNREST]: -50
                    }
                ),
                new SimEvent("Ignore the Rebellion", 0,
                    "The conflict drags on and critiques of Japan's modernization become highly mainstream. You save military resources, but the revolutionaries gain ground. The Meiji government loses its hold over the people.",
                    {
                        [Stats.MILITARY]: 20,
                        [Stats.NATIONALISM]: -80,
                        [Stats.UNREST]: 300
                    },
                    false, true     // this is a loss condition and not a win condition
                )
            )
        ),
        [combineYearAndSeason(1881, Seasons.AUTUMN)]: new SimSpecialEvent("Freedom and People's Rights", Seasons.AUTUMN,
            "A nationwide movement of former samurai, rural elites, and intellectuals like former oligarch Itagaki Taisuke demand a national assembly and constitutional government.",
            [
                new SimEvent("Promise a Constitution", 75,
                    "Despite reluctance from authoritarian advocates like Itō Hirobumi, an Imperial Rescript promises national constitution will be drafted and an assembly convened within the decade. This forces a slight diversion of attention within the government.",
                    {
                        [Stats.INDUSTRY]: -15,
                        [Stats.MILITARY]: -15,
                        [Stats.NATIONALISM]: 50,
                        [Stats.UNREST]: -50
                    }
                ),
                new SimEvent("Suppress the Movement", 225,
                    "Police powers are expanded and political societies advocating democracy are silenced. The government maintains authority, but resentment grows among activists and rural elites.",
                    {
                        [Stats.MILITARY]: 45,
                        [Stats.NATIONALISM]: -30,
                        [Stats.UNREST]: 30
                    }
                ),
                new SimEvent("Ignore the Movement", 0,
                    "Officials refrain from formally addressing political activists' demands. While the government avoids making concessions, frustration brews.",
                    {
                        [Stats.NATIONALISM]: -30,
                        [Stats.UNREST]: 30
                    }
                )
            ]
        ),
        [combineYearAndSeason(1882, Seasons.SPRING)]: new SimSpecialEvent("The Matsukata Deflation", Seasons.SPRING,
            "Finance Minister Matsukata Masayoshi tightens the money supply to stop inflation and stabilize the yen. Rice prices are falling and don't look to be rising under the policies any time soon.",
            [
                new SimEvent("Moderate Reform", 150,
                    "Minister Matsukata is not fond of reform efforts and has the support of fellow genrō. Your suggestion is ignored and the policy is continued, stabilizing finances but devastating businesses and forcing many farmers into tenancy.",
                    {
                        [Stats.INDUSTRY]: 50,
                        [Stats.UNREST]: 75
                    }
                ),
                new SimEvent("Continue Policy", 0,
                    "The government continues enforcing harsh fiscal discipline. Finances stabilize but many farmers and small businesses are devastated.",
                    {
                        [Stats.INDUSTRY]: 50,
                        [Stats.UNREST]: 75
                    }
                )
            ]
        ),
        [combineYearAndSeason(1884, Seasons.WINTER)]: new SimSpecialEvent("Kapsin Coup", Seasons.WINTER,
            "Reformist officials in Korea, inspired by Japanese modernization, want assistance in overthrowing the pro-Qing conservative court. However, Qing troops remain stationed in Seoul.",
            [
                new SimEvent("Send Military Support", 225,
                    "Covert military support is sent to the reformists. Thanks to the development of the army, the Qing forces are toppled and the reformists take charge; conditions are favorable to Japan.",
                    {
                        [Stats.INDUSTRY]: 70,
                        [Stats.MILITARY]: 20,
                        [Stats.NATIONALISM]: 70,
                        [Stats.UNREST]: -30
                    }
                ),
                new SimEvent("Support Covertly", 75,
                    "Limited diplomatic support is provided to the reformists. The coup fails, but Japan avoids major backlash.",
                    {
                        [Stats.MILITARY]: 10,
                        [Stats.NATIONALISM]: -20,
                        [Stats.UNREST]: -20
                    }
                ),
                new SimEvent("Remain Neutral", 0,
                    "Concerns of military weakness lead the country to remain neutral. After a failed coup, reformist leaders flee to Japan.",
                    {
                        [Stats.MILITARY]: 20,
                        [Stats.NATIONALISM]: -30,
                        [Stats.UNREST]: -10
                    }
                )
            ],
            { [Stats.MILITARY]: 500 },
            new SimSpecialEvent("Kapsin Coup", Seasons.WINTER,
                "Reformist officials in Korea, inspired by Japanese modernization, want assistance in overthrowing the pro-Qing conservative court. However, Qing troops remain stationed in Seoul. Concerns over Korea as the \"dagger to the throat\" of Japan are only rising.",
                [
                    new SimEvent("Send Military Support", 225,
                        "Covert military support is sent to the reformists. Unfortunately, the coup is unsuccessful despite Japan's support; Qing leadership is reinforced and Japan must make concessions.",
                        {
                            [Stats.MILITARY]: -30,
                            [Stats.NATIONALISM]: -25,
                            [Stats.UNREST]: 30
                        }
                    ),
                    new SimEvent("Support Covertly", 75,
                        "Limited diplomatic support is provided to the reformists. The coup fails, but Japan avoids major backlash.",
                        {
                            [Stats.MILITARY]: 10,
                            [Stats.NATIONALISM]: -20,
                            [Stats.UNREST]: -20
                        }
                    ),
                    new SimEvent("Remain Neutral", 0,
                        "Concerns of military weakness lead the country to remain neutral. After a failed coup, reformist leaders flee to Japan.",
                        {
                            [Stats.MILITARY]: 20,
                            [Stats.NATIONALISM]: -30,
                            [Stats.UNREST]: -10
                        }
                    )
                ]
            )
        ),
        [combineYearAndSeason(1889, Seasons.SPRING)]: new SimSpecialEvent("The Meiji Constitution", Seasons.SPRING,
            "After years of study, debate, and guidance, Itō Hirobumi prepares a constitution inspired largely by the Prussian model. Before its presentation, the nature of the constitution is discussed.",
            [
                new SimEvent("Strong Imperial Constitution", 0,
                    "The new constitution emphasizes the sovereignty of the Emperor and allows limited parliamentary participation. Modernization and imperial authority are balanced.",
                    {
                        [Stats.NATIONALISM]: 70,
                        [Stats.MILITARY]: 20,
                        [Stats.UNREST]: -10
                    }
                ),
                new SimEvent("Suggest Representative Constitution", 0,
                    "Your suggestion is unpopular among fellow genrō, who hold reservations about establishing full representation. As such, it is ignored. A constitution emphasizing the sovereignty of the Emperor and allowing quite limited parliamentary participation is passed.",
                    {
                        [Stats.NATIONALISM]: 70,
                        [Stats.MILITARY]: 20,
                        [Stats.UNREST]: -10
                    }
                )
            ]
        ),
        [combineYearAndSeason(1890, Seasons.AUTUMN)]: new SimSpecialEvent("Imperial Rescript on Education", Seasons.AUTUMN,
            "Concerned with upholding traditional loyalty and social order, the government drafts a statement defining the moral foundations of education.",
            [
                new SimEvent("Emphasize Imperial Authority", 0,
                    "Copies of the rescript are sent to schools across the empire, where students memorize its teachings on filial duty and service to the Emperor. National unity strengthens and education becomes more ideologically rigid.",
                    {
                        [Stats.NATIONALISM]: 50,
                        [Stats.MILITARY]: 25
                    }, true, false
                ),
                new SimEvent("Emphasize Western Models", 0,
                    "The genrō aren't fond of your concept; they wish for a rescript that will unite the youth under the absolute sovereignty and glory of Emperor Meiji. They go forward with their concept and ignore your suggestion.",
                    {
                        [Stats.NATIONALISM]: 50,
                        [Stats.MILITARY]: 25
                    }, true, false
                ),
                new SimEvent("Suggest Less Rigid Policy", 0,
                    "The genrō aren't fond of your concept; they wish for a rescript that will unite the youth under the absolute sovereignty and glory of Emperor Meiji. They go forward with their concept and ignore your suggestion.",
                    {
                        [Stats.NATIONALISM]: 50,
                        [Stats.MILITARY]: 25
                    }, true, false
                ),
            ]
        )
    };

    constructor(eventPool = FirstDecadeEvents, specialEvents = SimEventHandler.BASE_SPECIAL_EVENTS) {
        this.eventPool = eventPool;
        this.costEventPool = [...eventPool.COST_EVENTS];
        this.freeEventPool = [...eventPool.FREE_EVENTS];
        this.events = { ...specialEvents };
    }

    generateRandomEvent() {
        // generating a free event and two cost events randomly
        if (this.freeEventPool.length === 0) this.freeEventPool = [...this.eventPool.FREE_EVENTS];
        const freeEvent = this.freeEventPool.splice(Math.floor(Math.random() * this.freeEventPool.length), 1)[0];
        const costEvents = [];
        for (let i = 0; i < 2; i++) {
            if (this.costEventPool.length === 0) this.costEventPool = [...this.eventPool.COST_EVENTS];
            costEvents.push(this.costEventPool.splice(Math.floor(Math.random() * this.costEventPool.length), 1)[0]);
        }

        return new SimMultiEvent(costEvents, freeEvent);
    }

    prepareYearEvents(year) {
        // check if we should update the event pool this year
        // (setting this up structurally for more event pools)
        if (year >= 1880 && this.eventPool !== SecondDecadeEvents) {
            this.eventPool = SecondDecadeEvents;
            this.costEventPool = [...SecondDecadeEvents.COST_EVENTS];
            this.freeEventPool = [...SecondDecadeEvents.FREE_EVENTS];
        }

        // randomly creating 2 events for the year
        let addedEvents = 0;
        let attempts = 1;
        while (addedEvents < SimEventHandler.EVENTS_PER_YEAR) {
            const randomDate = combineYearAndSeason(year, Math.floor(Math.random() * 4));
            if (!(randomDate in this.events)) {
                this.events[randomDate] = this.generateRandomEvent();
                ++addedEvents;
            }
            if (attempts > 1000) return;
            ++attempts;
        }
    }

    getEventFromDate(year, season) {
        // getting the key format from year, season
        const eventKey = combineYearAndSeason(year, season);

        // if there is an event for this date
        if (eventKey in this.events) {
            // storing this event for processing
            const theEvent = this.events[eventKey];

            // checking requirements and alternate if present
            if (theEvent.requirements !== null && theEvent.alternate !== null)
                for (const stat in theEvent.requirements) {
                    if (SimState.instance().stats[stat] < theEvent.requirements[stat])
                        return theEvent.alternate;
                }
            
            // otherwise, either requirements are met or there are none
            return theEvent;
        }

        // if, for any reason, no event should be presented for this date, return null
        return null;
    }
}


// outputting important info for me
console.log("1870-1880 EVENTS:",
    "\n\tCost Events:", FirstDecadeEvents.COST_EVENTS.length,
    "\n\tFree Events:", FirstDecadeEvents.FREE_EVENTS.length
);
console.log("1880-1890 EVENTS:",
    "\n\tCost Events:", SecondDecadeEvents.COST_EVENTS.length,
    "\n\tFree Events:", SecondDecadeEvents.FREE_EVENTS.length
);
console.log("SPECIAL EVENTS:", Object.keys(SimEventHandler.BASE_SPECIAL_EVENTS).length);

SimState.instance().reset();
SimUI.resetButton.onclick = () => {
    SimState.instance().reset();
    SimUI.resetButton.classList.remove("selected");
    SimUI.resetButton.blur();
}