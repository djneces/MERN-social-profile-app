import axios from 'axios';

const setAuthToken = (token) => {
  //we take the token from the local storage, if any
  if (token) {
    //set the global headers
    axios.defaults.headers.common['x-auth-token'] = token;
  } else {
    //if no token in the LS we delete the headers
    delete axios.defaults.headers.common['x-auth-token'];
  }
};

export default setAuthToken;
