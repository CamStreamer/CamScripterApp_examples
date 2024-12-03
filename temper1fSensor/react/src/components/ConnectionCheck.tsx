import { useCheckConnection } from '../hooks/useCheckConnection';
import { Button, Box, Chip, Typography } from '@mui/material';
import styled from '@mui/material/styles/styled';

type Props = {
    protocol: string;
    ipAddress: string;
    port: string;
    areCredentialsValid: boolean;
    credentials: string[];
};

export const ConnectionCheck = ({ protocol, ipAddress, port, areCredentialsValid, credentials }: Props) => {
    const [handleCheck, isDisabled, getLabelText, getChipClass] = useCheckConnection({
        protocol,
        ipAddress,
        port,
        areCredentialsValid,
        credentials,
    });

    return (
        <StyledBox>
            <Typography fontWeight={700}>Connection</Typography>
            <StyledConnectionChip color={getChipClass()} label={getLabelText()} />
            <Button variant="outlined" onClick={handleCheck} disabled={isDisabled}>
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
