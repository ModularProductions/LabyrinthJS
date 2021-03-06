import React from "react";

function showHealth(health) {
  if (health === 100) {
    return "Perfect";
  } else if (health > 85 ) {
    return "Pretty good";
  } else if (health > 70 ) {
    return "All right";
  } else if (health > 60 ) {
    return "Starting to hurt";
  } else if (health > 45 ) {
    return "Hurting";
  } else if (health > 30 ) {
    return "Really rough";
  } else if (health > 15 ) {
    return "Bleeding profusely";
  } else if (health > 0 ) {
    return "Almost dead";
  } else return "Dead";
}

const Statistics = props => (
  <div id="statistics">
    <h2>Statistics</h2>
    <p>Health: {showHealth(props.health)}</p>
    <p>Attack: {props.attack}</p>
    <p>Defense: {props.defense}</p>
    <p>Moves taken: {props.moveCount}</p>
  </div>
);

export default Statistics;