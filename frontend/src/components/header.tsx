import { Link, useLocation } from "react-router-dom";
import logo from "../assets/dddforumlogo.png";
import { useUserSession } from "../context/UserSessionContext";
import { appSelectors, toClass } from "../shared/selectors";

function Logo() {
  return (
    <div id="app-logo">
      <img src={logo} alt="DDD Forum" />
    </div>
  );
}

function Title() {
  return (
    <div id="title-container">
      <h1>Domain-Driven Designers</h1>
      <h3>Where awesome domain driven designers are made</h3>
    </div>
  );
}

function Submission() {
  return (
    <div id="submission-container">
      <Link to="/submit">submit</Link>
    </div>
  );
}

type HeaderUser = { username: string } | null;

function HeaderActionButton({ user }: { user: HeaderUser }) {
  return (
    <div id="header-action-button">
      {user ? (
        <div>
          <div className={toClass(appSelectors.header.selector)}>Hello, {user.username}!</div>
          <button type="button">Logout</button>
        </div>
      ) : (
        <Link to="/join">Join</Link>
      )}
    </div>
  );
}

function shouldShowActionButton(pathname: string) {
  return pathname !== "/join";
}

export function Header() {
  const { pathname } = useLocation();
  const { user } = useUserSession();

  return (
    <header id="header" className="flex align-center">
      <Logo />
      <div id="header-middle">
        <Title />
        <Submission />
      </div>
      {shouldShowActionButton(pathname) ? (
        <HeaderActionButton user={user} />
      ) : null}
    </header>
  );
}
