import React, { useState } from 'react';

import Collapse from '@mui/material/Collapse';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Typography } from '@mui/material';
import styled from 'styled-components';

type Props = {
    initialContentClosed?: boolean;
    title: string;
    closedContent?: React.ReactNode;
    children: React.ReactNode;
};

export const CollapsibleFormContent = ({ initialContentClosed, title, closedContent, children }: Props) => {
    const [contentExpanded, setContentExpanded] = useState(!initialContentClosed);
    return (
        <StyledWrapper>
            <StyledHeader onClick={() => setContentExpanded(!contentExpanded)}>
                <Typography fontWeight={500} textTransform="uppercase" color="#313F53">
                    {title}
                </Typography>
                {contentExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </StyledHeader>
            <StyledCollapse in={contentExpanded}>{children}</StyledCollapse>
            {closedContent && !contentExpanded ? (
                <StyledCloseContentWrapper>{closedContent}</StyledCloseContentWrapper>
            ) : null}
        </StyledWrapper>
    );
};

const StyledWrapper = styled.div`
    display: flex;
    flex-direction: column;

    .MuiIcon-root {
        color: #999;
    }
`;

const StyledHeader = styled.div`
    display: flex;
    align-items: center;
    padding: 0.25rem 0.5rem;
    & :first-child {
        flex-grow: 1;
    }
    cursor: pointer;
    &:hover {
        background-color: rgba(0, 0, 0, 0.05);
    }
    transition: background-color 300ms;
    border-radius: 4px;
`;

const StyledCloseContentWrapper = styled.div`
    padding-inline: 0.5rem;
`;

const StyledCollapse = styled(Collapse)`
    width: 100%;
    padding-left: 1.5rem;
    border-left: 2px solid #f2f2f2;
    box-sizing: border-box;
    & .MuiCollapse-wrapperInner {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }
`;
