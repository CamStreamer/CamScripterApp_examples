import CircularProgress, { CircularProgressProps } from '@mui/material/CircularProgress';

import React from 'react';
import styled from 'styled-components';

type Props = {} & CircularProgressProps;

export const ContainerLoader = ({ ...props }: Props) => {
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
