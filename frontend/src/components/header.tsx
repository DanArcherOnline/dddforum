import { Link, useLocation } from "react-router-dom";
import logo from "../assets/dddforumlogo.png";

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
          <div>{user.username}</div>
          <u>
            <div>logout</div>
          </u>
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

  return (
    <header id="header" className="flex align-center">
      <Logo />
      <div id="header-middle">
        <Title />
        <Submission />
      </div>
      {shouldShowActionButton(pathname) ? (
        <HeaderActionButton user={null} />
      ) : null}
    </header>
  );
}
