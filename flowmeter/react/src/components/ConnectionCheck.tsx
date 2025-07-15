import { useCheckConnection } from '../hooks/useCheckConnection';
import { Button, Box, Chip, Typography } from '@mui/material';
import styled from '@mui/material/styles/styled';

type Props = {
    isFetching: boolean;
    isCameraResponding: boolean;
    areCredentialsValid: boolean;
    check: () => void;
};

export const ConnectionCheck = ({ isFetching, isCameraResponding, areCredentialsValid, check }: Props) => {
    const [isDisabled, getLabelText, getChipClass] = useCheckConnection({
        isFetching,
        isCameraResponding,
        areCredentialsValid,
    });

    return (
        <StyledBox>
            <Typography fontWeight={700}>Connection</Typography>
            <StyledConnectionChip color={getChipClass()} label={getLabelText()} />
            <Button variant="outlined" onClick={check} disabled={isDisabled}>
                Check
            </Button>
        </StyledBox>
    );
};

const StyledBox = styled(Box)`
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 10px 0;
`;

const StyledConnectionChip = styled(Chip)`
    cursor: default;
    margin-right: 10px;
`;
