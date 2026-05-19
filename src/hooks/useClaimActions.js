import { useCallback } from "react";
import { useAsyncAction } from "./useAsyncAction";
import { getKVAdapter } from "../utils/kvAdapter";
import { isOnline } from "../utils/onlineStatus";
import { getMessageForError } from "../constants/errorMessages";

export function useClaimActions({ claim, familyContext, showToast, onClose, fetchClaim }) {
  // 승인
  const approveAction = useAsyncAction(useCallback(async () => {
    if (!isOnline()) {
      showToast({ type: "error", message: "오프라인 상태에서는 처리할 수 없어요" });
      return;
    }
    const adapter = getKVAdapter();
    await adapter.patchClaim(claim.claim_id, {
      status: "approved",
      decided_by_member_id: familyContext.member_id,
      expected_updated_at: claim.updated_at,
    });
    showToast({ type: "success", message: "승인되었습니다!" });
    onClose();
  }, [claim, familyContext.member_id, showToast, onClose]));

  // 지급 (전액 또는 부분)
  const payAction = useAsyncAction(useCallback(async (paidAmount) => {
    if (!isOnline()) {
      showToast({ type: "error", message: "오프라인 상태에서는 처리할 수 없어요" });
      return;
    }
    const adapter = getKVAdapter();
    const patchData = {
      status: "paid",
      paid_by_member_id: familyContext.member_id,
      expected_updated_at: claim.updated_at,
    };
    if (paidAmount !== undefined && paidAmount !== null) {
      patchData.paid_amount = paidAmount;
    }
    await adapter.patchClaim(claim.claim_id, patchData);
    const isPartial = paidAmount && paidAmount < (claim.snapshot?.calculation?.total || 0);
    showToast({ type: "success", message: isPartial ? `${paidAmount.toLocaleString("ko-KR")}원 부분 지급 완료!` : "지급 완료!" });
    onClose();
  }, [claim, familyContext.member_id, showToast, onClose]));

  // 거절 (사유 입력 후)
  async function handleReject(reason) {
    if (!isOnline()) {
      showToast({ type: "error", message: "오프라인 상태에서는 처리할 수 없어요" });
      return;
    }
    const adapter = getKVAdapter();
    try {
      await adapter.patchClaim(claim.claim_id, {
        status: "rejected",
        rejection_reason: reason,
        decided_by_member_id: familyContext.member_id,
        expected_updated_at: claim.updated_at,
      });
      showToast({ type: "success", message: "거절되었습니다" });
      return { success: true };
    } catch (err) {
      if (err.code === "CONFLICT") {
        showToast({ type: "error", message: "이미 처리된 청구입니다 (다른 부모가 처리)" });
        return { success: true, conflict: true };
      } else {
        showToast({ type: "error", message: getMessageForError(err) });
        return { success: false };
      }
    }
  }

  function handleAction(action) {
    action.run().catch((err) => {
      if (err.code === "CONFLICT") {
        showToast({ type: "error", message: "이미 처리된 청구입니다 (다른 부모가 처리)" });
        onClose();
      } else {
        showToast({ type: "error", message: getMessageForError(err) });
      }
    });
  }

  // 거절 취소 (되돌리기)
  const undoRejectAction = useAsyncAction(useCallback(async () => {
    if (!isOnline()) {
      showToast({ type: "error", message: "오프라인 상태에서는 처리할 수 없어요" });
      return;
    }
    const adapter = getKVAdapter();
    await adapter.patchClaim(claim.claim_id, {
      status: "pending",
      decided_by_member_id: familyContext.member_id,
      expected_updated_at: claim.updated_at,
    });
    showToast({ type: "success", message: "거절이 취소되었습니다" });
    fetchClaim();
  }, [claim, familyContext.member_id, showToast, fetchClaim]));

  const isActing = approveAction.loading || payAction.loading || undoRejectAction.loading;

  return {
    approveAction,
    payAction,
    handleReject,
    handleAction,
    undoRejectAction,
    isActing,
  };
}
