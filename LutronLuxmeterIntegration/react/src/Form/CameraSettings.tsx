import styled from '@emotion/styled';
import { Box } from '@mui/material';
import { Control } from 'react-hook-form';
import { TSettings } from '../models/schema';
import { CameraList } from './CameraList';

type Props = {
    control: Control<TSettings>;
};

export const DataProcess = ({ control }: Props) => {
    return (
        <StyledForm>
            <StyledSection>
                <CameraList control={control} />
            </StyledSection>
        </StyledForm>
    );
};

const StyledForm = styled(Box)({
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
});

const StyledSection = styled(Box)({
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
});
