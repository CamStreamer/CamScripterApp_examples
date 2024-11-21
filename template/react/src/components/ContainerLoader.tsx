import { CircularProgressProps } from '@mui/material/CircularProgress';
import { CircularProgress, Typography } from '@mui/material';
import styled from '@mui/material/styles/styled';

type Props = {
    infoText?: string;
} & CircularProgressProps;

export const ContainerLoader = ({ infoText, ...props }: Props) => {
    return (
        <StyledContent>
            <CircularProgress {...props} />
            {infoText !== undefined && <Typography fontSize={20}>{infoText}</Typography>}
        </StyledContent>
    );
};

const StyledContent = styled('div')`
    width: 100%;
    height: 100%;
    display: grid;
    place-items: center;
    padding-block: 1.5rem;
    gap: 16px;
`;
