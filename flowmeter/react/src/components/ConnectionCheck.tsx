import { useCheckConnection } from '../hooks/useCheckConnection';
import { Button, Typography } from '@mui/material';
import { StyledBox, StyledChip } from './FormInputs';

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
            <StyledChip color={getChipClass()} label={getLabelText()} />
            <Button variant="outlined" onClick={check} disabled={isDisabled}>
                Check
            </Button>
        </StyledBox>
    );
};
