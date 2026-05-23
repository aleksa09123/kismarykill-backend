from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field, model_validator

from app.models.enums import VoteType


class VoteInput(BaseModel):
    target_id: int = Field(gt=0)
    tip_glasa: VoteType


class VoteRoundRequest(BaseModel):
    votes: list[VoteInput]

    @model_validator(mode="after")
    def validate_votes(self) -> "VoteRoundRequest":
        if len(self.votes) != 3:
            raise ValueError("Exactly 3 votes are required for one round")

        vote_targets = [vote.target_id for vote in self.votes]
        if len(set(vote_targets)) != len(vote_targets):
            raise ValueError("Each vote must target a different user")

        used_actions = {vote.tip_glasa for vote in self.votes}
        if used_actions != {VoteType.kiss, VoteType.marry, VoteType.kill}:
            raise ValueError("Round must include one kiss, one marry and one kill")

        return self


class VoteRoundResponse(BaseModel):
    status: str
    saved_votes: int


class BotFeedbackEntry(BaseModel):
    actor_user_id: int
    actor_name: str
    target_user_id: int
    target_name: str
    tip_glasa: VoteType
    is_for_current_user: bool
    timestamp: datetime


class BotFeedbackResponse(BaseModel):
    total: int
    kisses: int
    marries: int
    kills: int
    recent: list[BotFeedbackEntry]
    is_masked: bool = False
    paywall_message: str | None = None
