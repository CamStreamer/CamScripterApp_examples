import Divider from '@mui/material/Divider';
import styled from 'styled-components';

export const StyledFormValuesRow = styled.div`
    display: grid;
    gap: 0.5rem;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
`;

export const StyledHorizontalDivider = styled(Divider)`
    &.MuiDivider-root {
        margin-block: 1rem;
    }
`;
