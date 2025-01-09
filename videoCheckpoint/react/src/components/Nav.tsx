import Typography from '@mui/material/Typography';
import { styled } from '@mui/material/styles';
import logo from '../assets/CS-icon.svg';

export const Nav = () => {
    return (
        <StyledNav>
            <StyledLink href="/local/camscripter/settings.html">
                <StyledImage src={logo} alt="camscripter-logo" /> <StyledText>CamScripter</StyledText>
            </StyledLink>
        </StyledNav>
    );
};

const StyledNav = styled('nav')`
    background-color: #15273d;
    padding: 0.5rem 1rem;
    display: flex;
    align-items: center;
    color: #fff;
    position: sticky;
    top: 0;
    z-index: 10;
`;

const StyledLink = styled('a')`
    display: flex;
    align-items: center;
    gap: 0.5rem;
    text-decoration: none;
    color: inherit;
`;

const StyledImage = styled('img')`
    width: 3em;
`;

const StyledText = styled(Typography)`
    font-size: 1.2em;
`;
