import React from 'react';
import { Modal, ModalHeader, ModalBody } from "reactstrap";
import room from "../Objects/RoomBuilder";
import About from "../components/About.jsx";
import Help from "../components/Help.jsx";
import Game from "../components/Game";
import Inventory from "../components/Inventory.jsx";
import Equipment from "../components/Equipment.jsx";
import Statistics from "../components/Statistics.jsx";
import { Input } from "../components/Form";
var Item = require("../Objects/ItemBuilder");
var Creature = require("../Objects/CreatureBuilder");
// var Room = require("../Objects/RoomBuilder");
// import room from "../Objects/RoomBuilder";

// const newTurn = (location) => {

// };

const uselessWords = [
  "the", "a", "at"
]


const generalCommands = [
  "look", "l", "wait", "z", "rest", "wait", "exa", "examine"
];

const itemCommands = [
  "take", "get", "pick", "grab", "drop", "discard", "hold"
];

const specialCommands = [
  "save", "load", "again", "g", "restore", "load", "again", "g"
];

const moveCommands = [
  "n", "ne", "e", "se", "s", "sw", "w", "nw", "north", "east", "south", "west", "northeast", "southeast", "southwest", "northwest", "go", "walk", "run", "enter", "in", "up", "u", "d", "down", "leave"
];

const updateScroll = () => {
  var element = document.getElementById("roomDesc");
  element.scrollTop = element.scrollHeight;
};

let isMobile = window.innerWidth < 768 ? true : false;

let gameData = {
  moveCount: 0,
  player: {
    location: 2,
    equipment: {
      wielded: "nothing",
      head: "nothing",
      body: "nothing",
      arms: "nothing",
      legs: "nothing"
    },
    inventory: [Item.cellPhone],
    stats: {
      health: 100,
      attack: 0,
      defense: 3
    },
    options: {
      verbose: true,
    }
  },
  creatures: [Creature.cat],
  textBuffer: []
};

class GamePage extends React.Component {

  componentDidMount() {

    // update authenticated state on logout
    this.props.toggleAuthenticateStatus();

    if (this.loadData) {
      gameData = this.loadData;
    } else {
      this.describeRoom(this.state.game.player.location);
    };
  }

  state = {
    userCommand: "",
    lastCommand: "",
    inProgress: true,
    authenticated: false,
    login: false,
    viewCharacter: false,
    viewAbout: false,
    viewHelp: false,
    isMobile: isMobile,
    game: gameData
  }

  echo = (relay, noTime, command) => {
    let arr = this.state.game.textBuffer.concat();
    relay.forEach(ele => {
      if (command === true) ele="> "+ele;
      // keep textBuffer limited to 100 items
      if (arr.length > 100) arr.splice(0, 1);
      arr.push(ele);       
    });
    // advance turn here if calling echo is not marked "noTime"
    let moveCount = this.state.game.moveCount;
    console.log("this.state.game.creatures =", this.state.game.creatures);
    let creatures = this.state.game.creatures.slice();
    if (!noTime) {
      console.log("turn advancing");
      moveCount++;
      creatures = this.advanceTurn(creatures);
    }
    // set new textBuffer in state
    this.setState(prevState => ({
      userCommand: "",
      game: {
        ...prevState.game,
        moveCount: moveCount,
        textBuffer: arr,
        creatures: creatures
      }
    }));
    updateScroll();
  }

  handleUserCommand = this.handleUserCommand.bind(this);  

  // *
  // * HANDLE PLAYER COMMAND INPUT
  // *

  handleInputChange = event => {
    this.setState({ userCommand: event.target.value });
  };

  async handleUserCommand(event) {
    event.preventDefault();
    // check for non-empty command input
    if (this.state.userCommand) {
      let thisCommand = this.state.userCommand;
      // echo command
      await this.echo([this.state.userCommand], "noTime", true);
      // start command processing and turn action here
      this.parseCommand(thisCommand);
      // assure roomDesc window is scrolled to bottom
      updateScroll();
    }
  }
  
  // parse command
  parseCommand = (commandInput) => {
    const commandWords = commandInput.trim().toLowerCase().split(" ", 8);
    if (commandWords.length === 8) this.echo(["Warning - this game is pretty dumb, and will only accept sentences of up to 8 words. It probably won't even use all eight. Look out for Version 2, coming soon!"], "noTime");
    // trim unnecessary words
    let command = [];
    // if (command[0] !== "g" || command[0] !== "again") {async (commandInput) => {await this.setState({ lastCommand: commandInput })}};
    commandWords.forEach(ele => {if (!uselessWords.includes(ele)) command.push(ele)});
    //check for move command
    if (moveCommands.indexOf(command[0]) !== -1) {this.movePlayer(command)}
    else if (specialCommands.indexOf(command[0]) !== -1) {this.specialAction(command)}
    else if (itemCommands.indexOf(command[0]) !== -1) {this.itemAction(command)}
    else if (generalCommands.indexOf(command[0]) !== -1) {this.generalAction(command)}
    else {this.echo(["SYSTEM: Unknown command. - in parseCommand(), command =", command.join(", ")], "noTime"); console.log("parseCommand() error")};
  }

  // *
  // * Special actions
  // *

  specialAction(words) {
    let response;
    switch (words[0]) {
      case "again" : case "g" : 
        if (this.state.lastCommand) {
          response = () => this.parseCommand(this.state.lastCommand)
        } else {
          response = () => this.echo(["What do you want to do again?"], "noTime")
        }; break;
      default : response = undefined
    }
    if (!response) {
      this.echo(["SYSTEM: Command not defined. - at specialAction(), words = '"+words.join(", ")], "noTime");
      console.log("Command not defined at specialAction()")
    } else response(); 
  }

  // *
  // * Item actions
  // *

  itemAction(words) {
    let response;
    switch (words[0]) {
      case "take" : case "get" : case "pick" : case "grab" : {
        response = () => this.takeItem(words[1]); break;
      }
      case "drop" : case "discard" : {
        response = () => this.dropItem(words[1]); break;
      }
      default : response = undefined
    }
    if (!response) {
      this.echo(["SYSTEM: Command not defined. - at itemAction(), words = '"+words.join(", ")], "noTime");
      console.log("Command not defined at itemAction()");
    } else response(); 
  }

  takeItem(word) {    
    if (word === "all" || word === "everything") {
      if (room[this.state.game.player.location].inventory) {
        let items = room[this.state.game.player.location].inventory.concat();
        room[this.state.game.player.location].inventory = [];
        let inv = this.state.game.player.inventory.concat(items);
        this.setState(prevState => ({
          game: {
            ...prevState.game,
            player: {
               ...prevState.game.player,
               inventory: inv
            }
          }
        }))
        this.echo(["You pick up everything that's not nailed down."]);
      } else this.echo(["You don't see anything you can take."], "noTime");
    } else {
      let response = undefined;
      if (!response) {
        room[this.state.game.player.location].inventory.forEach((ele, i) => {
          console.log("checking room inventory", ele);
          if (ele.keywords.includes(word)) {
            response = room[this.state.game.player.location].inventory.splice(i, 1);
          }
        })
      };
      if (!response) {
        console.log("features check")
        room[this.state.game.player.location].features.forEach((ele) => {
          console.log("checking room feature", ele.keywords);
          if (ele.keywords.includes(word)) {
            response = "You can't take that.";
          }
        })
      };
      if (!response) {
        this.state.game.player.inventory.forEach((ele) => {
          if (ele.keywords.includes(word)) {
            response = "You already have that!";
          }
        })
      }
      if (!response) {
        this.state.game.creatures.forEach((ele) => {
          if (ele.location === this.state.game.player.location) {
            if (ele.keywords.includes(word)) {
              response = "I don't think they would like that.";
            }
          }
        })
      }
      if (!response) {this.echo(["You don't see that here."], "noTime")}
      if (typeof response === "string") {this.echo([response], "noTime")}
      else if (response) {
        let inv = this.state.game.player.inventory.concat(response);
        this.setState(prevState => ({
          game: {
            ...prevState.game,
            player: {
                ...prevState.game.player,
                inventory: inv
            }
          }
        }))
        this.echo(["You pick up the "+response[0].shortName+"."])
      } else {
        this.echo(["SYSTEM: takeItem() failed: word =", word], "noTime");
        console.log("takeItem failed");
      }
    }
  }

  dropItem(word) {
    if (word === "all" || word === "everything") {
      if (this.state.game.player.inventory.length) {
        this.state.game.player.inventory.forEach(ele => room[this.state.game.player.location].inventory.push(ele));
        this.setState(prevState => ({
          game: {
            ...prevState.game,
            player: {
              ...prevState.game.player,
              inventory: []
            }
          }
        }))
        this.echo(["You drop everything you're carrying."]);
      } else this.echo(["You aren't carrying anything."], "noTime");
    } else {
      let item = undefined;
      console.log("player inv =", this.state.game.player.inventory);
      this.state.game.player.inventory.forEach((ele, i) => {
        console.log("ele keywords =", ele.keywords);
        if (ele.keywords.includes(word)) {
          console.log("true");
          item = this.state.game.player.inventory[i];
          console.log("item =", item);
        }
      });
      if (!item) {this.echo(["You don't have that."], "noTime")}
      else {
        let inv = this.state.game.player.inventory.concat();
        item = inv.splice(item, 1);
        room[this.state.game.player.location].inventory.push(item[0]);
        this.setState(prevState => ({
          game: {
            ...prevState.game,
            player: {
              ...prevState.game.player,
              inventory: inv
            }
          }
        }))
        this.echo(["You drop the "+item[0].shortName+"."])
      }
    }
  }

  // *
  // * General actions
  // *

  generalAction(words) {
    switch (words[0]) {
      case "l" : case "look" : case "exa" : case "examine" :
        this.examine(words); break;
      case "z" : case "rest" : case "wait" :
        this.echo(["You chill for a minute. It's been a tough day, and you've earned it."]); break;
      default : this.echo(["SYSTEM: Command not defined. - at generalAction(), words = "+words.join(", ")], "noTime"); console.log("Command not defined at generalAction()");
    }
  }
  
  // Examine/Look action command
  examine(words) {
    console.log("examine() firing, words = "+words.join(", "));
    let response = undefined;
    if (words.length === 1 || words[1] === "room" || words[1] === "around") {
      response = () => this.describeRoom(this.state.game.player.location);
    }
    // check if player is a narcissist
    if (!response) {
      if (words[1] === "me" || words[1] === "myself") {
        response = () => {this.echo(["You fine specimen, you."], "noTime"); if (isMobile) this.viewCharacterToggle()} 
      }
    }
    // check player inventory if object not yet found
    if (!response) {
      this.state.game.player.inventory.forEach((ele, i) => {
        if (ele.keywords.includes(words[1])) {
          response = () => this.echo([ele.lookDesc], "noTime");
        }
      })
    }
    // check room inventory if object not yet found
    if (!response) {
      room[this.state.game.player.location].inventory.forEach((ele, i) => {
        if (ele.keywords.includes(words[1])) {
          response = () => this.echo([ele.lookDesc], "noTime");
        }
      })
    }
    // check room features if object not yet found
    if (!response) {
      room[this.state.game.player.location].features.forEach((ele, i) => {
        if (ele.keywords.includes(words[1])) {
          response = () => this.echo([ele.lookDesc], "noTime");
        }
      });
    }
    // check present creatures if object not yet found
    if (!response) {
      this.state.game.creatures.forEach(ele => {
        if (ele.location === this.state.game.player.location) {
          if (ele.keywords.includes(words[1])) {
            response = () => this.echo([ele.lookDesc], "noTime");
          }
        }
      })
    }
    // check present creature features if object not yet found
    if (!response) {
      this.state.game.creatures.forEach(ele => {
        if (ele.location === this.state.game.player.location) {
          if (ele.features[words[1]]) {
            response = () => this.echo([ele.features[words[1]], "noTime"]);
          }
        }
      })
    }
    // insert entity inventory check
    if (!response) {
      console.log("Tried to examine something and didn't find it.");
      this.echo(["You don't see that here."], "noTime");
    } else response();
  }

  // *
  // * Move actions
  // *

  movePlayer(words) {
    let currLoc = this.state.game.player.location;
    let newLoc;
    const nope = "You can't go that way.";
    const blocked = "That way is blocked.";
    if ((words[0] === "go" || words[0] === "walk" ||words[0] === "run")) {words.shift()};
    if ((words[0] === "n" || words[0] === "north") && (words[1] === "e" || words[1] === "east")) {words[0] = "ne"};
    if ((words[0] === "n" || words[0] === "north") && (words[1] === "w" || words[1] === "west")) {words[0] = "nw"};
    if ((words[0] === "s" || words[0] === "south") && (words[1] === "e" || words[1] === "east")) {words[0] = "se"};
    if ((words[0] === "s" || words[0] === "south") && (words[1] === "w" || words[1] === "west")) {words[0] = "sw"};
    switch (words[0]) {
      case "n" : case "north" :
        if (room[currLoc].n.to) {
          room[currLoc].n.blocked ? newLoc = blocked : newLoc = room[currLoc].n.to;
        } else { newLoc = nope }
        break;
      case "s" : case "south" :
        if (room[currLoc].s.to) {
          room[currLoc].s.blocked ? newLoc = blocked : newLoc = room[currLoc].s.to;
        } else { newLoc = nope }
        break;
      case "e" : case "east" :
        if (room[currLoc].e.to) {
          room[currLoc].e.blocked ? newLoc = blocked : newLoc = room[currLoc].e.to;
        } else { newLoc = nope }
        break;
      case "w" : case "west" :
        if (room[currLoc].w.to) {
          room[currLoc].w.blocked ? newLoc = blocked : newLoc = room[currLoc].w.to;
        } else { newLoc = nope }
        break;
      case "ne" : case "northeast" :
        if (room[currLoc].ne.to) {
          room[currLoc].ne.blocked ? newLoc = blocked : newLoc = room[currLoc].ne.to;
        } else { newLoc = nope }
        break;
      case "se" : case "southeast" :
        if (room[currLoc].se.to) {
          room[currLoc].se.blocked ? newLoc = blocked : newLoc = room[currLoc].se.to;
        } else { newLoc = nope }
        break;
      case "sw" : case "southwest" :
        if (room[currLoc].sw.to) {
          room[currLoc].sw.blocked ? newLoc = blocked : newLoc = room[currLoc].sw.to;
        } else { newLoc = nope }
        break;
      case "nw" : case "northwest" :
        if (room[currLoc].nw.to) {
          room[currLoc].nw.blocked ? newLoc = blocked : newLoc = room[currLoc].nw.to;
        } else { newLoc = nope }
        break;
      case "u" : case "up" :
        if (room[currLoc].up.to) {
          room[currLoc].up.blocked ? newLoc = blocked : newLoc = room[currLoc].up.to;
        } else { newLoc = nope }
        break;
      case "d" : case "down" :
        if (room[currLoc].down.to) {
          room[currLoc].down.blocked ? newLoc = blocked : newLoc = room[currLoc].down.to;
        } else { newLoc = nope }
        break;
      case "in" : case "into" :
        if (room[currLoc].in.to) {
          room[currLoc].in.blocked ? newLoc = blocked : newLoc = room[currLoc].in.to;
        } else { newLoc = nope }
        break;
      case "leave" : case "out" :
        if (room[currLoc].out.to) {
          room[currLoc].out.blocked ? newLoc = blocked : newLoc = room[currLoc].out.to;
        } else { newLoc = nope }
        break;
      default : newLoc = "SYSTEM: Movement not defined. - at movePlayer(), words[0] = '"+words[0]+"'";
        console.log("Movement not defined at movePlayer()");
    }
    if (typeof newLoc !== "number") { this.echo([newLoc]) } else {
      this.setState(prevState => ({
          game: {
            ...prevState.game,
            player: {
               ...prevState.game.player,
               location: newLoc
          }
        }
      }))
      this.describeRoom(this.state.game.player.location);
    }
  };

  // echo description of room and any present items, creatures, and exits
  describeRoom(currLoc) {
    let relay = [];
    // add room name to echo relay
    relay.push(room[currLoc].name);
    // add room description to echo relay
    relay.push(room[currLoc].desc);
    // add creatures present to echo relay
    this.state.game.creatures.forEach((ele, i) => {
      if (ele.location === this.state.game.player.location) {
        let thisCreature="There is a ";
        thisCreature+=ele.shortName;
        thisCreature+=ele.doing;
        relay.push(thisCreature);
      }
    })
    // add room inventory contents to echo relay
    if (room[currLoc].inventory.length !== 0) {
      let items = ["You see "];
      room[currLoc].inventory.forEach((ele, i) => {
        if (i === 0) {
          items+="a "+ele.shortName;
        } else 
        if (i > 0 && i === room[currLoc].inventory.length - 1) {
          if (room[currLoc].inventory.length !== 2) items+=",";
          items+=" and a "+ele.shortName;
        } else {
          items+=", a "+ele.shortName;
        }
      })
      items+=" here.";
      relay.push(items);
    }
    // console.log("@ describeRoom() current room object = ", room[currLoc]);
    // add exits to echo relay
    let exits =[];
    if (room[currLoc].n.to && room[currLoc].n.visible) {exits.push("north")};
    if (room[currLoc].ne.to && room[currLoc].ne.visible) {exits.push("northeast")};
    if (room[currLoc].e.to && room[currLoc].e.visible) {exits.push("east")};
    if (room[currLoc].se.to && room[currLoc].se.visible) {exits.push("southeast")};
    if (room[currLoc].s.to && room[currLoc].s.visible) {exits.push("south")};
    if (room[currLoc].sw.to && room[currLoc].sw.visible) {exits.push("southwest")};
    if (room[currLoc].w.to && room[currLoc].w.visible) {exits.push("west")};
    if (room[currLoc].nw.to && room[currLoc].nw.visible) {exits.push("northwest")};
    if (room[currLoc].up.to && room[currLoc].up.visible) {exits.push("up")};
    if (room[currLoc].down.to && room[currLoc].down.visible) {exits.push("down")};
    if (room[currLoc].in.to && room[currLoc].in.visible) {exits.push("in")};
    if (room[currLoc].out.to && room[currLoc].out.visible) {exits.push("out")};
    relay.push("Exits: "+exits.join(", "));
    // echo 
    this.echo(relay, "noTime");
  }

  // *
  // * Turn handling for Creatures
  // *

  advanceTurn(creatures) {
    creatures.forEach((ele, i) => {
      // check if there is an action queued in Creature's script array
      let creatureIndex = i;
      let thisCreature = ele.shortName;
      if (ele.script.length) {
        console.log(thisCreature+"'s location before move = "+ele.location);
        // console.log("room =", room[ele.location]);
        switch (ele.script[0]) {
          case "moveRandom" : 
            let exits = [];
            let thisRoom = room[ele.location];
            if (thisRoom.n.to && thisRoom.n.visible && !thisRoom.n.blocked && ((thisCreature !== "Minotaur" || thisRoom.n.minPass))) {exits.push(thisRoom.n.to)};
            if (thisRoom.ne.to && thisRoom.ne.visible && !thisRoom.ne.blocked && ((thisCreature !== "Minotaur" || thisRoom.ne.minPass))) {exits.push(thisRoom.ne.to)};
            if (thisRoom.e.to && thisRoom.e.visible && !thisRoom.e.blocked && (thisCreature !== "Minotaur" || thisRoom.e.minPass)) {exits.push(thisRoom.e.to)};
            if (thisRoom.se.to && thisRoom.se.visible && !thisRoom.se.blocked && ((thisCreature !== "Minotaur" || thisRoom.se.minPass))) {exits.push(thisRoom.se.to)};
            if (thisRoom.s.to && thisRoom.s.visible && !thisRoom.s.blocked && ((thisCreature !== "Minotaur" || thisRoom.s.minPass))) {exits.push(thisRoom.s.to)};
            if (thisRoom.sw.to && thisRoom.sw.visible && !thisRoom.sw.blocked && ((thisCreature !== "Minotaur" || thisRoom.sw.minPass))) {exits.push(thisRoom.sw.to)};
            if (thisRoom.w.to && thisRoom.w.visible && !thisRoom.w.blocked && ((thisCreature !== "Minotaur" || thisRoom.w.minPass))) {exits.push(thisRoom.w.to)};
            if (thisRoom.nw.to && thisRoom.nw.visible && !thisRoom.nw.blocked && ((thisCreature !== "Minotaur" || thisRoom.nw.minPass))) {exits.push(thisRoom.nw.to)};
            if (thisRoom.up.to && thisRoom.up.visible && !thisRoom.up.blocked && ((thisCreature !== "Minotaur" || thisRoom.up.minPass))) {exits.push(thisRoom.up.to)};
            if (thisRoom.down.to && thisRoom.down.visible && !thisRoom.down.blocked && ((thisCreature !== "Minotaur" || thisRoom.down.minPass))) {exits.push(thisRoom.down.to)};
            if (thisRoom.in.to && thisRoom.in.visible && !thisRoom.in.blocked && ((thisCreature !== "Minotaur" || thisRoom.in.minPass))) {exits.push(thisRoom.in.to)};
            if (thisRoom.out.to && thisRoom.out.visible && !thisRoom.out.blocked && ((thisCreature !== "Minotaur" || thisRoom.out.minPass))) {exits.push(thisRoom.out.to)};
            let roll = Math.floor(Math.random() * Math.floor(100));
            console.log("exits =", exits);
            if (roll <= 20) {
              console.log("staying put, roll =", roll);
              // creature stays put
            } else {
              for (let i = 0 ; i < exits.length; i++) {
                if (roll <= 20 + (i+1) * (80 / exits.length)) {
                  console.log(thisCreature+"'s location after move = "+exits[i]+" ; roll = ", roll);
                  this.echo(["The creature walks to another room."], "noTime");
                  creatures[creatureIndex].location = exits[i];
                  break;
                }
              }
            }
            break;
          case "chase" :
            break;
          case "search" :
            break;
          case "blinded" :
            break;
          default: this.echo(["advanceTurn() defaulted"], "noTime"); console.log("advanceTurn() defaulted");
        }
      }
    })
    return creatures;
  }
  
  // *
  // * BUTTON HANDLING
  // *

  viewCharacterToggle = () => {
    this.setState({viewCharacter: !this.state.viewCharacter});
  }

  viewAboutToggle = () => {
    this.setState({viewAbout: !this.state.viewAbout});
  }

  viewHelpToggle = () => {
    this.setState({viewHelp: !this.state.viewHelp});
  }

  handleSaveButton = data => {
    console.log("Save button firing");
    // API.saveState({
    //   id: data.id,
    //   headline: data.headline,
    //   snippet: data.snippet,
    //   datePublished: data.date,
    //   url: data.url
    // })
    //   .then(res => console.log(res))
    //   .catch(err => console.log(err))
    // ;
  };
  
  render() {

    return (
      <div>
        <Modal isOpen={this.state.viewCharacter} toggle={this.viewCharacterToggle} className="characterModal">
          <ModalHeader toggle={this.viewCharacterToggle}>You</ModalHeader>
          <ModalBody>
            <Statistics stats={this.state.game.player.stats}/>
            <Equipment equipment={this.state.game.player.equipment}/>
            <Inventory inventory={this.state.game.player.inventory}/>
          </ModalBody>
        </Modal>
        <About 
          viewAbout={this.state.viewAbout}viewAboutToggle={this.viewAboutToggle.bind(this)} />
        <Help 
          viewHelp={this.state.viewHelp} viewHelpToggle={this.viewHelpToggle.bind(this)}/>
        <Game 
          moveCount={this.state.game.moveCount}
          player={this.state.game.player} 
          entities={this.state.game.entities} 
          textBuffer={this.state.game.textBuffer} 
          viewAboutToggle={this.viewAboutToggle.bind(this)}
          viewHelpToggle={this.viewHelpToggle.bind(this)}
          viewCharacterToggle={this.viewCharacterToggle.bind(this)}
          handleLoginButton={this.handleLoginButton}  
          handleSaveButton={this.handleSaveButton}
          handleQuitButton={this.props.handleQuitButton}>
          <form className="userCommandLine">
            <div className="form-group">
              <label>>&nbsp;</label>
              <Input
                value={this.state.userCommand}
                onChange={this.handleInputChange}
                name="userCommand"
                type="text"
                id="command"
                data-lpignore="true"
                autoComplete="off"
                onClick={(e) => {this.handleUserCommand(e)}} 
              />
              <button type="submit" onClick={(e) => {this.handleUserCommand(e)}} className="btn btn-success d-none">Submit</button>
            </div>
          </form>
        </Game>
      </div>
    )

    // original boilerplate
    // return (
    //   <Card className="container">
    //     <CardTitle title="React Application" subtitle="This is the home page." />
    //       {Auth.isUserAuthenticated() ? (
    //         <CardText style={{ fontSize: '16px', color: 'green' }}>Welcome! You are logged in.</CardText>
    //       ) : (
    //         <CardText style={{ fontSize: '16px', color: 'green' }}>You are not logged in.</CardText>
    //       )}
    //   </Card>
    // )
    // end original boilerplate
  }
};

export default GamePage;
