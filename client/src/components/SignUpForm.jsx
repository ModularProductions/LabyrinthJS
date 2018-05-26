import React from "react";
import API from "../utils/API";
import Auth from "../utils/Auth";

class SignUpForm extends React.Component {
  // set the initial component state
  state = {
    errors: {},
    user: {
      email: "",
      name: "",
      password: ""
    }
  }

  componentWillUnmount() {
    this.setState({     
      user: {
        email: "",
        name: "",
        password: ""
      }
    })
  }
  /**
  * Process the form.
  *
  * @param {object} event - the JavaScript event object
  */
  processSignupForm = event => {
    // prevent default action. in this case, action is the form submission event
    event.preventDefault();
    // create a string for an HTTP body message
    const { name, email, password } = this.state.user;
    console.log("test res:", this.state.user);
    
    //const formData = `email=${email}&password=${password}`;
    API.signUp({name, email, password}).then(res => {
      
      // change the component-container state
      // set a message
      localStorage.setItem('successMessage', res.data.message);
      this.setState({
        errors: {}
      });
      console.log("signup successful, localStorage =", localStorage);
      console.log("in processSignupForm(), Auth.isUserAuthenticated() =", Auth.isUserAuthenticated());
      this.props.refreshUserScreen();

    }).catch(( {response} ) => {
      console.log("in API.signUp().catch(), response.data =", response.data);
      const errors = response.data.errors ? response.data.errors : {};
      errors.summary = response.data.message;
      this.setState({
        errors
      });
    });
  }

  /**
   * Change the user object.
   *
   * @param {object} event - the JavaScript event object
   */
  changeUser = event => {
    const field = event.target.name;
    const user = this.state.user;
    user[field] = event.target.value;

    this.setState({
      user
    });
  }

  /**
   * Render the component.
   */
  render() {
    return (
      <div className="container">
        <form action="/" onSubmit={this.processSignupForm}>
          <h2 className="card-heading">Sign Up</h2>
          {this.state.errors.summary && <p className="error-message">{this.state.errors.summary}</p>}
    
          <div className="field-line">
          <label>name:</label>
            <input
              name="name"
              onChange={this.changeUser}
              value={this.state.user.name}
            />
          </div>
    
          <div className="field-line">
          <label>email: </label>
            <input
              name="email"
              onChange={this.changeUser}
              value={this.state.user.email}
            />
          </div>
    
          <div className="field-line">
          <label>password:</label>
            <input
              type="password"
              name="password"
              onChange={this.changeUser}
              value={this.state.user.password}
            />
          </div>
    
          <div className="button-line">
            <button type="submit">Create New Account</button>
          </div>
          <p className="footnote">Already have an account? <button onClick={this.props.toggleForms}>Sign in</button></p>
        </form>
      </div>
    )
  };
};

export default SignUpForm;