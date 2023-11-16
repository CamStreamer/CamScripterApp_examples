import styled, { css } from 'styled-components';

import React from 'react';
import Typography from '@mui/material/Typography';

type Props = {
    label: string;
    htmlFor?: string;
    fullWidth?: boolean;
    children?: React.ReactNode;
};

export const WithLabel = ({ label, htmlFor, fullWidth, children }: Props) => {
    return (
        <StyledCont htmlFor={htmlFor ?? ''} $fullWidth={!!fullWidth}>
            <Typography whiteSpace="nowrap" color="#313F53" fontSize="0.875rem">
                {label}
            </Typography>
            {children}
        </StyledCont>
    );
};

const StyledCont = styled.label<{
    $fullWidth: boolean;
}>`
    display: flex;
    flex-direction: column;
    ${({ $fullWidth }) =>
        $fullWidth
            ? css`
                  flex-grow: 1;
              `
            : css``};

    gap: 0.5rem;
    margin-bottom: 0;
    max-width: 100%;
`;
