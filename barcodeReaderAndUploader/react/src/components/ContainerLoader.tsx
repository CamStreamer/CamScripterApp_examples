import CircularProgress, { CircularProgressProps } from '@mui/material/CircularProgress';

import React from 'react';
import styled from 'styled-components';

export const ContainerLoader = ({ ...props }: CircularProgressProps) => {
    return (
        <StyledContent>
            <CircularProgress {...props} />
        </StyledContent>
    );
};

const StyledContent = styled.div`
    width: 100%;
    height: 100%;
    display: grid;
    place-items: center;
`;
