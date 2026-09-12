import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-employee-pagination',
  template: `
    <div class="pagination">
      <div class="pagination__info">
        Showing {{ startItem }}–{{ endItem }} of {{ totalElements() }} employees
      </div>
      
      <div class="pagination__controls">
        <div class="pagination__size">
          <label for="pageSize">Per page:</label>
          <select id="pageSize" [value]="pageSize()" (change)="onPageSizeChange($event)">
            <option [value]="10">10</option>
            <option [value]="25">25</option>
            <option [value]="50">50</option>
            <option [value]="100">100</option>
          </select>
        </div>
        
        <div class="pagination__buttons">
          <button 
            class="btn-page" 
            [disabled]="currentPage() <= 1" 
            (click)="onPageChange(currentPage() - 1)"
            aria-label="Previous page">
            Previous
          </button>
          <span class="pagination__current">Page {{ currentPage() }} of {{ totalPages() }}</span>
          <button 
            class="btn-page" 
            [disabled]="currentPage() >= totalPages()" 
            (click)="onPageChange(currentPage() + 1)"
            aria-label="Next page">
            Next
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .pagination {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
      padding: 16px 0;
    }
    .pagination__info {
      font-size: 14px;
      color: #64748b;
    }
    .pagination__controls {
      display: flex;
      align-items: center;
      gap: 24px;
      flex-wrap: wrap;
    }
    .pagination__size {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      color: #475569;
    }
    .pagination__size select {
      height: 32px;
      padding: 0 8px;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      background: #ffffff;
      color: #1e293b;
      outline: none;
    }
    .pagination__buttons {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .btn-page {
      height: 32px;
      padding: 0 16px;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
      color: #334155;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-page:hover:not(:disabled) {
      background: #f8fafc;
      border-color: #94a3b8;
    }
    .btn-page:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .pagination__current {
      font-size: 14px;
      font-weight: 500;
      color: #334155;
    }
  `]
})
export class EmployeePaginationComponent {
  currentPage = input.required<number>();
  pageSize = input.required<number>();
  totalElements = input.required<number>();
  totalPages = input.required<number>();

  pageChanged = output<number>();
  pageSizeChanged = output<number>();

  get startItem(): number {
    if (this.totalElements() === 0) return 0;
    return (this.currentPage() - 1) * this.pageSize() + 1;
  }

  get endItem(): number {
    const end = this.currentPage() * this.pageSize();
    return end > this.totalElements() ? this.totalElements() : end;
  }

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.pageChanged.emit(page);
    }
  }

  onPageSizeChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.pageSizeChanged.emit(Number(select.value));
  }
}
