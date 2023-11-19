import CircularProgress, { CircularProgressProps } from '@mui/material/CircularProgress';

import React from 'react';
import Typography from '@mui/material/Typography';
import styled from 'styled-components';

type Props = {
    infoText?: string;
} & CircularProgressProps;

export const ContainerLoader = ({ infoText, ...props }: Props) => {
    return (
        <StyledContent>
            <CircularProgress {...props} />
            {infoText && <Typography fontSize={20}>{infoText}</Typography>}
        </StyledContent>
    );
};

const StyledContent = styled.div`
    width: 100%;
    height: 100%;
    display: grid;
    place-items: center;

    padding-block: 1.5rem;
    gap: 16px;
`;
