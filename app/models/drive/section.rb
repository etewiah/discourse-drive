module Drive
  class Section < ActiveRecord::Base
    self.table_name = "sections"

    # belongs_to :discette

    serialize :meta, JSON


  end
end
